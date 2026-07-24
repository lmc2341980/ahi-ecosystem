from __future__ import annotations

from uuid import UUID, uuid4

from fastapi import APIRouter, HTTPException, Query, status

from .adapters import get_adapter
from .config import get_settings
from .database import get_supabase
from .schemas import (
    AIModel,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    ChatRole,
    ChatWithHistoryInput,
    ChatWithHistoryResponse,
    Conversation,
    ConversationMessage,
    CreateConversationInput,
    EmbeddingRequest,
    EmbeddingResponse,
    SendMessageInput,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])
settings = get_settings()


# --- Model listing ---


@router.get("/models", response_model=list[AIModel])
async def list_models() -> list[AIModel]:
    all_models: list[AIModel] = []
    for provider in ("openai", "gemini", "ollama"):
        try:
            adapter = get_adapter(provider, settings)
            all_models.extend(await adapter.list_models())
        except Exception:
            continue
    return all_models


# --- Direct chat (stateless) ---


@router.post("/chat", response_model=ChatCompletionResponse)
async def chat_completion(request: ChatCompletionRequest) -> ChatCompletionResponse:
    if request.stream:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Streaming is not supported via this endpoint",
        )
    adapter = get_adapter(request.provider.value, settings)
    try:
        return await adapter.chat_completion(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )


# --- Embeddings ---


@router.post("/embeddings", response_model=EmbeddingResponse)
async def create_embeddings(request: EmbeddingRequest) -> EmbeddingResponse:
    adapter = get_adapter(request.provider.value, settings)
    try:
        return await adapter.create_embeddings(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )


# --- Conversation persistence ---


@router.get("/conversations", response_model=dict)
def list_conversations(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    db = get_supabase()
    offset = (page - 1) * page_size
    count_resp = db.table("conversations").select("id", count="exact").execute()
    total = count_resp.count or 0
    resp = (
        db.table("conversations")
        .select("*")
        .order_by("updated_at", desc=True)
        .range(offset, offset + page_size - 1)
        .execute()
    )
    return {
        "data": resp.data,
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/conversations", response_model=Conversation, status_code=status.HTTP_201_CREATED)
def create_conversation(input_data: CreateConversationInput) -> Conversation:
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "title": input_data.title,
        "provider": input_data.provider.value,
        "model": input_data.model,
    }
    resp = db.table("conversations").insert(row).execute()
    return Conversation.model_validate(resp.data[0])


@router.get("/conversations/{conversation_id}", response_model=Conversation)
def get_conversation(conversation_id: UUID) -> Conversation:
    db = get_supabase()
    resp = (
        db.table("conversations")
        .select("*")
        .eq("id", str(conversation_id))
        .maybe_single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return Conversation.model_validate(resp.data)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: UUID) -> None:
    db = get_supabase()
    resp = db.table("conversations").delete().eq("id", str(conversation_id)).execute()
    if not resp.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")


@router.get("/conversations/{conversation_id}/messages", response_model=list[ConversationMessage])
def list_messages(conversation_id: UUID) -> list[ConversationMessage]:
    db = get_supabase()
    resp = (
        db.table("messages")
        .select("*")
        .eq("conversation_id", str(conversation_id))
        .order_by("created_at", desc=False)
        .execute()
    )
    return [ConversationMessage.model_validate(row) for row in resp.data]


@router.post("/conversations/{conversation_id}/messages", response_model=ConversationMessage, status_code=status.HTTP_201_CREATED)
def add_message(conversation_id: UUID, input_data: SendMessageInput) -> ConversationMessage:
    if input_data.conversation_id != conversation_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Conversation ID mismatch")
    db = get_supabase()
    row = {
        "id": str(uuid4()),
        "conversation_id": str(conversation_id),
        "role": input_data.role.value,
        "content": input_data.content,
        "token_count": input_data.token_count,
    }
    resp = db.table("messages").insert(row).execute()
    db.table("conversations").update({"updated_at": "now()"}).eq("id", str(conversation_id)).execute()
    return ConversationMessage.model_validate(resp.data[0])


# --- Chat with history (combines persistence + AI call) ---


@router.post("/chat-with-history", response_model=ChatWithHistoryResponse)
async def chat_with_history(input_data: ChatWithHistoryInput) -> ChatWithHistoryResponse:
    db = get_supabase()

    # Create or fetch conversation
    if input_data.conversation_id is None:
        conv_row = {
            "id": str(uuid4()),
            "title": input_data.title or input_data.message[:60],
            "provider": input_data.provider.value,
            "model": input_data.model,
        }
        conv_resp = db.table("conversations").insert(conv_row).execute()
        conversation_id = conv_resp.data[0]["id"]
    else:
        conversation_id = str(input_data.conversation_id)
        conv_resp = (
            db.table("conversations")
            .select("*")
            .eq("id", conversation_id)
            .maybe_single()
            .execute()
        )
        if not conv_resp.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    # Save user message
    user_msg_row = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "role": ChatRole.user.value,
        "content": input_data.message,
        "token_count": 0,
    }
    user_resp = db.table("messages").insert(user_msg_row).execute()
    user_message = ConversationMessage.model_validate(user_resp.data[0])

    # Fetch full conversation history
    history_resp = (
        db.table("messages")
        .select("role, content")
        .eq("conversation_id", conversation_id)
        .order_by("created_at", desc=False)
        .execute()
    )
    history_messages = [
        ChatMessage(role=ChatRole(row["role"]), content=row["content"])
        for row in history_resp.data
    ]

    # Call AI adapter
    request = ChatCompletionRequest(
        provider=input_data.provider,
        model=input_data.model,
        messages=history_messages,
        temperature=input_data.temperature,
        max_tokens=input_data.max_tokens,
    )
    adapter = get_adapter(input_data.provider.value, settings)
    try:
        ai_response = await adapter.chat_completion(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI provider error: {exc}",
        )

    # Save assistant message
    assistant_msg_row = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "role": ChatRole.assistant.value,
        "content": ai_response.message.content,
        "token_count": ai_response.usage.total_tokens,
    }
    assistant_resp = db.table("messages").insert(assistant_msg_row).execute()
    assistant_message = ConversationMessage.model_validate(assistant_resp.data[0])

    # Update conversation timestamp
    db.table("conversations").update({"updated_at": "now()"}).eq("id", conversation_id).execute()

    return ChatWithHistoryResponse(
        conversation_id=UUID(conversation_id),
        user_message=user_message,
        assistant_message=assistant_message,
        usage=ai_response.usage,
    )
