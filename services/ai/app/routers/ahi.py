from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from .database import get_supabase
from .ahi_orchestrator import AhiOrchestrator, AhiSuBiet
from .schemas import ChatMessage, ChatRole

router = APIRouter(prefix="/api/v1/ahi", tags=["ahi-ecosystem"])


# ============================================================
# AHI-WS: Workspace endpoints
# ============================================================


class CreateWorkspaceInput(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    owner_type: str = Field(default="person")
    owner_id: UUID


class CreateWSMessageInput(BaseModel):
    workspace_id: UUID
    entity_type: str = Field(default="human")
    entity_id: UUID | None = None
    role: str = Field(default="user")
    content: str = Field(min_length=1)
    token_count: int = Field(default=0)


class OrchestrateInput(BaseModel):
    workspace_id: UUID
    message: str = Field(min_length=1)
    strategy: str = Field(default="single")
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1)


@router.get("/workspaces")
def list_workspaces(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    db = get_supabase()
    offset = (page - 1) * page_size
    count_resp = db.table("ahi_workspaces").select("id", count="exact").execute()
    total = count_resp.count or 0
    resp = (
        db.table("ahi_workspaces")
        .select("*")
        .order_by("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {"data": resp.data, "total": total, "page": page, "page_size": page_size}


@router.post("/workspaces", status_code=status.HTTP_201_CREATED)
def create_workspace(input_data: CreateWorkspaceInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "name": input_data.name,
        "owner_type": input_data.owner_type,
        "owner_id": str(input_data.owner_id),
    }
    resp = db.table("ahi_workspaces").insert(row).execute()
    return resp.data[0]


@router.get("/workspaces/{workspace_id}/messages")
def list_ws_messages(workspace_id: UUID) -> list[dict]:
    db = get_supabase()
    resp = (
        db.table("ahi_workspace_messages")
        .select("*")
        .eq("workspace_id", str(workspace_id))
        .order_by("created_at", desc=False)
        .execute()
    )
    return resp.data


@router.post("/workspaces/{workspace_id}/messages", status_code=status.HTTP_201_CREATED)
def create_ws_message(workspace_id: UUID, input_data: CreateWSMessageInput) -> dict:
    if input_data.workspace_id != workspace_id:
        raise HTTPException(status_code=400, detail="Workspace ID mismatch")
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "workspace_id": str(workspace_id),
        "entity_type": input_data.entity_type,
        "entity_id": str(input_data.entity_id) if input_data.entity_id else None,
        "role": input_data.role,
        "content": input_data.content,
        "token_count": input_data.token_count,
    }
    resp = db.table("ahi_workspace_messages").insert(row).execute()
    return resp.data[0]


# ============================================================
# AHI-Or: Orchestration endpoint
# ============================================================


@router.post("/orchestrate")
async def orchestrate(input_data: OrchestrateInput) -> dict:
    db = get_supabase()

    # Save user message to AHI-WS
    user_msg_row = {
        "id": str(uuid4()),
        "workspace_id": str(input_data.workspace_id),
        "entity_type": "human",
        "role": "user",
        "content": input_data.message,
    }
    user_resp = db.table("ahi_workspace_messages").insert(user_msg_row).execute()
    user_msg_id = user_resp.data[0]["id"]

    # Fetch conversation history
    history_resp = (
        db.table("ahi_workspace_messages")
        .select("role, content")
        .eq("workspace_id", str(input_data.workspace_id))
        .order_by("created_at", desc=False)
        .execute()
    )
    messages = [
        ChatMessage(role=ChatRole(row["role"]), content=row["content"])
        for row in history_resp.data
    ]

    # Orchestrate via AHI-Or
    orchestrator = AhiOrchestrator()
    try:
        ai_response, strategy_used = await orchestrator.orchestrate(
            messages=messages,
            strategy=input_data.strategy,
            temperature=input_data.temperature,
            max_tokens=input_data.max_tokens,
        )
    except Exception as exc:
        db.table("ahi_workspace_messages").update({"evaluation_status": "rejected"}).eq("id", user_msg_id).execute()
        raise HTTPException(status_code=502, detail=f"AHI-Or failed: {exc}")

    # Save AI response to AHI-WS
    ai_msg_row = {
        "id": str(uuid4()),
        "workspace_id": str(input_data.workspace_id),
        "entity_type": "ai",
        "role": "assistant",
        "content": ai_response.message.content,
        "token_count": ai_response.usage.total_tokens,
    }
    ai_resp = db.table("ahi_workspace_messages").insert(ai_msg_row).execute()
    ai_msg_id = ai_resp.data[0]["id"]

    # Record orchestration
    orchestrator.record_orchestration(
        workspace_message_id=UUID(user_msg_id),
        target_models=[ai_response.model],
        strategy=strategy_used,
        result_summary=ai_response.message.content[:200],
    )

    # AHI-SuBiet evaluation
    evaluator = AhiSuBiet()
    score, decision, reasoning = evaluator.evaluate(
        UUID(ai_msg_id), ai_response.message.content, "assistant"
    )
    evaluator.record_evaluation(UUID(ai_msg_id), score, decision, reasoning)

    return {
        "user_message_id": user_msg_id,
        "ai_message_id": ai_msg_id,
        "response": ai_response.message.content,
        "model": ai_response.model,
        "strategy": strategy_used,
        "usage": {
            "prompt_tokens": ai_response.usage.prompt_tokens,
            "completion_tokens": ai_response.usage.completion_tokens,
            "total_tokens": ai_response.usage.total_tokens,
        },
        "evaluation": {
            "score": score,
            "decision": decision,
            "reasoning": reasoning,
        },
    }


# ============================================================
# AHI-SuBiet: Evaluation endpoints
# ============================================================


class EvaluateInput(BaseModel):
    workspace_message_id: UUID
    score: float = Field(ge=0.0, le=1.0)
    decision: str
    reasoning: str | None = None


@router.post("/evaluate")
def evaluate_message(input_data: EvaluateInput) -> dict:
    evaluator = AhiSuBiet()
    return evaluator.record_evaluation(
        input_data.workspace_message_id,
        input_data.score,
        input_data.decision,
        input_data.reasoning or "",
    )


@router.get("/evaluations/{workspace_id}")
def list_evaluations(workspace_id: UUID) -> list[dict]:
    db = get_supabase()
    resp = (
        db.table("ahi_evaluations")
        .select("*, workspace_messages!inner(*)")
        .eq("workspace_messages.workspace_id", str(workspace_id))
        .order_by("created_at", desc=True)
        .execute()
    )
    return resp.data


# ============================================================
# AHI-Old: Legacy model registry
# ============================================================


class RegisterLegacyModelInput(BaseModel):
    ahi_name: str = Field(min_length=1)
    original_name: str = Field(min_length=1)
    provider: str = Field(min_length=1)
    is_free_tier: bool = False


@router.get("/legacy-models")
def list_legacy_models() -> list[dict]:
    db = get_supabase()
    resp = db.table("ahi_legacy_models").select("*").order_by("ahi_name").execute()
    return resp.data


@router.post("/legacy-models", status_code=status.HTTP_201_CREATED)
def register_legacy_model(input_data: RegisterLegacyModelInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "ahi_name": input_data.ahi_name,
        "original_name": input_data.original_name,
        "provider": input_data.provider,
        "is_free_tier": input_data.is_free_tier,
    }
    resp = db.table("ahi_legacy_models").insert(row).execute()
    return resp.data[0]


# ============================================================
# AHI-P: Person endpoints
# ============================================================


class CreatePersonInput(BaseModel):
    email: str = Field(min_length=1)
    display_name: str = Field(min_length=1)
    ahi_code: str | None = None
    country_code: str | None = None
    verification_level: str = Field(default="none")


@router.get("/persons")
def list_persons(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    db = get_supabase()
    offset = (page - 1) * page_size
    count_resp = db.table("ahi_persons").select("id", count="exact").execute()
    total = count_resp.count or 0
    resp = (
        db.table("ahi_persons")
        .select("*")
        .order_by("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {"data": resp.data, "total": total, "page": page, "page_size": page_size}


@router.post("/persons", status_code=status.HTTP_201_CREATED)
def create_person(input_data: CreatePersonInput) -> dict:
    db = get_supabase()
    ahi_code = input_data.ahi_code or f"AHI-P-{uuid4().hex[:8].upper()}"
    row = {
        "id": str(uuid4()),
        "email": input_data.email,
        "display_name": input_data.display_name,
        "ahi_code": ahi_code,
        "country_code": input_data.country_code or "",
        "verification_level": input_data.verification_level,
    }
    resp = db.table("ahi_persons").insert(row).execute()
    return resp.data[0]


@router.get("/persons/{person_id}")
def get_person(person_id: UUID) -> dict:
    db = get_supabase()
    resp = db.table("ahi_persons").select("*").eq("id", str(person_id)).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="AHI-P not found")
    return resp.data


# ============================================================
# AHI-O: Organization endpoints
# ============================================================


class CreateOrgInput(BaseModel):
    name: str = Field(min_length=1)
    slug: str = Field(min_length=1)
    description: str | None = None
    created_by: UUID | None = None
    governance_type: str = Field(default="quorum_50")
    country_code: str | None = None


@router.get("/organizations")
def list_ahi_orgs(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    db = get_supabase()
    offset = (page - 1) * page_size
    count_resp = db.table("ahi_organizations").select("id", count="exact").execute()
    total = count_resp.count or 0
    resp = (
        db.table("ahi_organizations")
        .select("*")
        .order_by("created_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {"data": resp.data, "total": total, "page": page, "page_size": page_size}


@router.post("/organizations", status_code=status.HTTP_201_CREATED)
def create_ahi_org(input_data: CreateOrgInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "name": input_data.name,
        "slug": input_data.slug,
        "description": input_data.description,
        "created_by": str(input_data.created_by) if input_data.created_by else None,
        "governance_type": input_data.governance_type,
        "country_code": input_data.country_code or "",
    }
    resp = db.table("ahi_organizations").insert(row).execute()
    return resp.data[0]


# ============================================================
# AHI-G: Geographic governance
# ============================================================


@router.get("/geographic")
def list_geographic() -> list[dict]:
    db = get_supabase()
    resp = db.table("ahi_geographic").select("*").order_by("country_name").execute()
    return resp.data


class CreateGeographicInput(BaseModel):
    country_code: str = Field(min_length=2, max_length=2)
    country_name: str = Field(min_length=1)
    region_name: str | None = None
    governance_type: str = Field(default="standard")


@router.post("/geographic", status_code=status.HTTP_201_CREATED)
def create_geographic(input_data: CreateGeographicInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "country_code": input_data.country_code.upper(),
        "country_name": input_data.country_name,
        "region_name": input_data.region_name,
        "governance_type": input_data.governance_type,
    }
    resp = db.table("ahi_geographic").insert(row).execute()
    return resp.data[0]


# ============================================================
# AHI-V: Verification endpoints
# ============================================================


class CreateVerificationInput(BaseModel):
    entity_type: str
    entity_id: UUID
    verifier_id: UUID | None = None
    status: str = Field(default="compliant")
    findings: str | None = None


@router.post("/verifications", status_code=status.HTTP_201_CREATED)
def create_verification(input_data: CreateVerificationInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "entity_type": input_data.entity_type,
        "entity_id": str(input_data.entity_id),
        "verifier_id": str(input_data.verifier_id) if input_data.verifier_id else None,
        "status": input_data.status,
        "findings": input_data.findings,
    }
    resp = db.table("ahi_verifications").insert(row).execute()

    # Update entity's is_ahi_s based on verification
    if input_data.status == "compliant":
        table_map = {"person": "ahi_persons", "organization": "ahi_organizations", "geographic": "ahi_geographic"}
        table = table_map.get(input_data.entity_type)
        if table:
            db.table(table).update({"is_ahi_s": True}).eq("id", str(input_data.entity_id)).execute()
    elif input_data.status == "violation":
        table_map = {"person": "ahi_persons", "organization": "ahi_organizations", "geographic": "ahi_geographic"}
        table = table_map.get(input_data.entity_type)
        if table:
            db.table(table).update({"is_ahi_s": False, "status": "frozen"}).eq("id", str(input_data.entity_id)).execute()

    return resp.data[0]


@router.get("/verifications")
def list_verifications(
    entity_type: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    db = get_supabase()
    offset = (page - 1) * page_size
    query = db.table("ahi_verifications").select("*", count="exact")
    if entity_type:
        query = query.eq("entity_type", entity_type)
    resp = query.order_by("created_at", desc=True).range(offset, offset + page_size - 1).execute()
    total = resp.count or 0
    return {"data": resp.data, "total": total, "page": page, "page_size": page_size}


# ============================================================
# AHI-Core: Constitution
# ============================================================


@router.get("/constitution")
def list_constitution() -> list[dict]:
    db = get_supabase()
    resp = (
        db.table("ahi_constitution")
        .select("*")
        .eq("is_active", True)
        .order_by("article_number")
        .execute()
    )
    return resp.data


# ============================================================
# AHI-Cache: 3-layer cache endpoints
# ============================================================


class CacheSetInput(BaseModel):
    key: str = Field(min_length=1)
    value: dict
    ttl_seconds: int = Field(default=60)


@router.post("/cache/l1")
def set_l1_cache(input_data: CacheSetInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "key": input_data.key,
        "value": input_data.value,
        "ttl_seconds": input_data.ttl_seconds,
    }
    resp = db.table("ahi_cache_l1").insert(row).execute()
    return resp.data[0]


@router.get("/cache/l1/{key}")
def get_l1_cache(key: str) -> dict:
    db = get_supabase()
    resp = db.table("ahi_cache_l1").select("*").eq("key", key).maybe_single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Cache key not found")
    return resp.data


class CacheL2SetInput(BaseModel):
    session_id: UUID
    key: str = Field(min_length=1)
    value: dict
    ttl_seconds: int = Field(default=3600)


@router.post("/cache/l2")
def set_l2_cache(input_data: CacheL2SetInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "session_id": str(input_data.session_id),
        "key": input_data.key,
        "value": input_data.value,
        "ttl_seconds": input_data.ttl_seconds,
    }
    resp = db.table("ahi_cache_l2").insert(row).execute()
    return resp.data[0]


class CacheL3SetInput(BaseModel):
    entity_type: str
    entity_id: UUID
    key: str = Field(min_length=1)
    value: dict


@router.post("/cache/l3")
def set_l3_cache(input_data: CacheL3SetInput) -> dict:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "entity_type": input_data.entity_type,
        "entity_id": str(input_data.entity_id),
        "key": input_data.key,
        "value": input_data.value,
    }
    resp = db.table("ahi_cache_l3").insert(row).execute()
    return resp.data[0]


@router.get("/cache/l3/{entity_type}/{entity_id}/{key}")
def get_l3_cache(entity_type: str, entity_id: UUID, key: str) -> dict:
    db = get_supabase()
    resp = (
        db.table("ahi_cache_l3")
        .select("*")
        .eq("entity_type", entity_type)
        .eq("entity_id", str(entity_id))
        .eq("key", key)
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Cache entry not found")
    db.table("ahi_cache_l3").update({
        "access_count": resp.data["access_count"] + 1,
        "last_accessed_at": "now()",
    }).eq("id", resp.data["id"]).execute()
    return resp.data
