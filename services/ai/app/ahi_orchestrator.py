from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4
from typing import Any

import httpx

from .config import get_settings
from .database import get_supabase
from .schemas import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    ChatRole,
    TokenUsage,
)
from .adapters import get_adapter

settings = get_settings()


class AhiOrchestrator:
    """AHI-Or: Routes user messages to free-tier AHI-Old models, aggregates results."""

    def __init__(self) -> None:
        self._db = get_supabase()

    def _get_free_models(self) -> list[dict[str, Any]]:
        resp = (
            self._db.table("ahi_legacy_models")
            .select("*")
            .eq("is_free_tier", True)
            .eq("status", "active")
            .execute()
        )
        return resp.data or []

    def _get_all_models(self) -> list[dict[str, Any]]:
        resp = (
            self._db.table("ahi_legacy_models")
            .select("*")
            .eq("status", "active")
            .execute()
        )
        return resp.data or []

    async def orchestrate(
        self,
        messages: list[ChatMessage],
        strategy: str = "single",
        temperature: float = 0.7,
        max_tokens: int | None = None,
    ) -> tuple[ChatCompletionResponse, str]:
        """Returns (response, orchestration_strategy_used)."""

        free_models = self._get_free_models()
        all_models = self._get_all_models()

        if not free_models and not all_models:
            raise RuntimeError("No AHI-Old models registered")

        target_models = free_models if free_models else all_models

        if strategy == "multi_aggregate" and len(target_models) >= 2:
            responses: list[ChatCompletionResponse] = []
            for model_row in target_models[:3]:
                try:
                    resp = await self._call_model(model_row, messages, temperature, max_tokens)
                    responses.append(resp)
                except Exception:
                    continue
            if not responses:
                raise RuntimeError("All AHI-Old models failed")
            return self._aggregate(responses), "multi_aggregate"

        if strategy == "fallback":
            for model_row in target_models:
                try:
                    resp = await self._call_model(model_row, messages, temperature, max_tokens)
                    return resp, "fallback"
                except Exception:
                    continue
            raise RuntimeError("All AHI-Old models failed in fallback")

        # Default: single — pick first available free model
        for model_row in target_models:
            try:
                resp = await self._call_model(model_row, messages, temperature, max_tokens)
                return resp, "single"
            except Exception:
                continue
        raise RuntimeError("No AHI-Old model could respond")

    async def _call_model(
        self,
        model_row: dict[str, Any],
        messages: list[ChatMessage],
        temperature: float,
        max_tokens: int | None,
    ) -> ChatCompletionResponse:
        provider = model_row["provider"]
        model_name = model_row["original_name"]

        adapter = get_adapter(provider, settings)
        request = ChatCompletionRequest(
            provider=adapter.provider,
            model=model_name,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return await adapter.chat_completion(request)

    def _aggregate(self, responses: list[ChatCompletionResponse]) -> ChatCompletionResponse:
        """Simple aggregation: pick the longest response (most informative)."""
        best = max(responses, key=lambda r: len(r.message.content))
        total_tokens = sum(r.usage.total_tokens for r in responses)
        return ChatCompletionResponse(
            id=f"ahi-or-{uuid4()}",
            provider="ahi_or",
            model="aggregated",
            message=best.message,
            usage=TokenUsage(
                prompt_tokens=sum(r.usage.prompt_tokens for r in responses),
                completion_tokens=sum(r.usage.completion_tokens for r in responses),
                total_tokens=total_tokens,
            ),
            created_at=datetime.now(timezone.utc),
        )

    def record_orchestration(
        self,
        workspace_message_id: UUID | None,
        target_models: list[str],
        strategy: str,
        result_summary: str,
        status: str = "completed",
    ) -> dict[str, Any]:
        row = {
            "id": str(uuid4()),
            "workspace_message_id": str(workspace_message_id) if workspace_message_id else None,
            "target_models": target_models,
            "strategy": strategy,
            "result_summary": result_summary[:500],
            "status": status,
        }
        resp = self._db.table("ahi_orchestrations").insert(row).execute()
        return resp.data[0] if resp.data else {}


class AhiSuBiet:
    """AHI-SuBiet: Evaluates workspace messages for promotion to permanent storage."""

    def __init__(self) -> None:
        self._db = get_supabase()

    def evaluate(
        self,
        workspace_message_id: UUID,
        content: str,
        role: str,
    ) -> tuple[float, str, str]:
        """Returns (score, decision, reasoning). Score 0-1, decision approved/rejected/needs_review."""
        score = self._heuristic_score(content, role)
        if score >= 0.7:
            decision = "approved"
        elif score < 0.3:
            decision = "rejected"
        else:
            decision = "needs_review"
        reasoning = f"Content length={len(content)}, role={role}, score={score:.2f}"
        return score, decision, reasoning

    def _heuristic_score(self, content: str, role: str) -> float:
        if not content.strip():
            return 0.0
        score = 0.0
        length = len(content)
        if length > 20:
            score += 0.2
        if length > 100:
            score += 0.2
        if length > 500:
            score += 0.1
        if role == "assistant" and length > 50:
            score += 0.2
        if role == "user" and length > 10:
            score += 0.1
        if "?" in content or "!" in content:
            score += 0.1
        has_code = "```" in content or "def " in content or "function " in content
        if has_code:
            score += 0.1
        return min(score, 1.0)

    def record_evaluation(
        self,
        workspace_message_id: UUID,
        score: float,
        decision: str,
        reasoning: str,
    ) -> dict[str, Any]:
        row = {
            "id": str(uuid4()),
            "workspace_message_id": str(workspace_message_id),
            "evaluator_type": "ahi_subiet",
            "score": score,
            "decision": decision,
            "reasoning": reasoning,
        }
        resp = self._db.table("ahi_evaluations").insert(row).execute()

        if decision == "approved":
            self._db.table("ahi_workspace_messages").update({
                "evaluation_status": "approved",
                "evaluated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", str(workspace_message_id)).execute()
        elif decision == "rejected":
            self._db.table("ahi_workspace_messages").update({
                "evaluation_status": "rejected",
                "evaluated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", str(workspace_message_id)).execute()

        return resp.data[0] if resp.data else {}
