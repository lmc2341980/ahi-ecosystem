from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

import httpx

from .schemas import (
    AIModel,
    ChatCompletionRequest,
    ChatCompletionResponse,
    ChatMessage,
    ChatRole,
    EmbeddingRequest,
    EmbeddingResponse,
    TokenUsage,
)


class AIAdapter(ABC):
    """Abstract base class for AI provider adapters."""

    provider: str

    @abstractmethod
    async def list_models(self) -> list[AIModel]:
        ...

    @abstractmethod
    async def chat_completion(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        ...

    @abstractmethod
    async def create_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        ...


class OpenAIAdapter(AIAdapter):
    provider = "openai"

    def __init__(self, api_key: str, base_url: str = "https://api.openai.com/v1") -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}

    async def list_models(self) -> list[AIModel]:
        if not self._api_key:
            return []
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self._base_url}/models", headers=self._headers())
            resp.raise_for_status()
            data = resp.json()
        models: list[AIModel] = []
        for item in data.get("data", []):
            model_id = item.get("id", "")
            models.append(
                AIModel(
                    id=model_id,
                    provider="openai",
                    name=model_id,
                    context_window=item.get("context_window", 4096),
                    supports_streaming=True,
                    supports_tool_calls=True,
                )
            )
        return models

    async def chat_completion(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        async with httpx.AsyncClient(timeout=60) as client:
            payload: dict[str, Any] = {
                "model": request.model,
                "messages": [{"role": m.role.value, "content": m.content} for m in request.messages],
                "temperature": request.temperature,
            }
            if request.max_tokens is not None:
                payload["max_tokens"] = request.max_tokens
            resp = await client.post(
                f"{self._base_url}/chat/completions", headers=self._headers(), json=payload
            )
            resp.raise_for_status()
            data = resp.json()
        choice = data["choices"][0]
        message = choice["message"]
        usage = data.get("usage", {})
        return ChatCompletionResponse(
            id=data["id"],
            provider="openai",
            model=data["model"],
            message=ChatMessage(role=ChatRole(message["role"]), content=message["content"]),
            usage=TokenUsage(
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=usage.get("completion_tokens", 0),
                total_tokens=usage.get("total_tokens", 0),
            ),
            created_at=datetime.fromtimestamp(data.get("created", 0), tz=timezone.utc) if data.get("created") else datetime.now(timezone.utc),
        )

    async def create_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {"model": request.model, "input": request.input}
            resp = await client.post(
                f"{self._base_url}/embeddings", headers=self._headers(), json=payload
            )
            resp.raise_for_status()
            data = resp.json()
        embeddings = [item["embedding"] for item in data.get("data", [])]
        usage = data.get("usage", {})
        return EmbeddingResponse(
            provider="openai",
            model=data["model"],
            embeddings=embeddings,
            usage=TokenUsage(
                prompt_tokens=usage.get("prompt_tokens", 0),
                completion_tokens=0,
                total_tokens=usage.get("total_tokens", 0),
            ),
        )


class GeminiAdapter(AIAdapter):
    provider = "gemini"

    def __init__(self, api_key: str, base_url: str = "https://generativelanguage.googleapis.com/v1beta") -> None:
        self._api_key = api_key
        self._base_url = base_url.rstrip("/")

    def _params(self) -> dict[str, str]:
        return {"key": self._api_key}

    async def list_models(self) -> list[AIModel]:
        if not self._api_key:
            return []
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self._base_url}/models", params=self._params())
            resp.raise_for_status()
            data = resp.json()
        models: list[AIModel] = []
        for item in data.get("models", []):
            name = item.get("name", "").replace("models/", "")
            models.append(
                AIModel(
                    id=name,
                    provider="gemini",
                    name=name,
                    context_window=item.get("inputTokenLimit", 30_000),
                    supports_streaming=True,
                    supports_tool_calls=True,
                )
            )
        return models

    async def chat_completion(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        async with httpx.AsyncClient(timeout=60) as client:
            contents = [
                {"role": "user" if m.role.value == "user" else "model", "parts": [{"text": m.content}]}
                for m in request.messages
                if m.role.value != "system"
            ]
            payload: dict[str, Any] = {
                "contents": contents,
                "generationConfig": {"temperature": request.temperature},
            }
            if request.max_tokens is not None:
                payload["generationConfig"]["maxOutputTokens"] = request.max_tokens
            resp = await client.post(
                f"{self._base_url}/models/{request.model}:generateContent",
                params=self._params(),
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        candidate = data.get("candidates", [{}])[0]
        content = (
            candidate.get("content", {}).get("parts", [{}])[0].get("text", "")
        )
        usage_meta = data.get("usageMetadata", {})
        return ChatCompletionResponse(
            id=data.get("responseId", ""),
            provider="gemini",
            model=request.model,
            message=ChatMessage(role=ChatRole.assistant, content=content),
            usage=TokenUsage(
                prompt_tokens=usage_meta.get("promptTokenCount", 0),
                completion_tokens=usage_meta.get("candidatesTokenCount", 0),
                total_tokens=usage_meta.get("totalTokenCount", 0),
            ),
            created_at=datetime.now(timezone.utc),
        )

    async def create_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        async with httpx.AsyncClient(timeout=30) as client:
            text_input = request.input if isinstance(request.input, str) else request.input[0]
            payload = {"model": f"models/{request.model}", "content": {"parts": [{"text": text_input}]}}
            resp = await client.post(
                f"{self._base_url}/models/{request.model}:embedContent",
                params=self._params(),
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        embedding = data.get("embedding", {}).get("values", [])
        return EmbeddingResponse(
            provider="gemini",
            model=request.model,
            embeddings=[embedding],
            usage=TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        )


class OllamaAdapter(AIAdapter):
    provider = "ollama"

    def __init__(self, base_url: str = "http://localhost:11434") -> None:
        self._base_url = base_url.rstrip("/")

    async def list_models(self) -> list[AIModel]:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(f"{self._base_url}/api/tags")
            resp.raise_for_status()
            data = resp.json()
        models: list[AIModel] = []
        for item in data.get("models", []):
            name = item.get("name", "")
            models.append(
                AIModel(
                    id=name,
                    provider="ollama",
                    name=name,
                    context_window=item.get("context_window", 4096),
                    supports_streaming=True,
                    supports_tool_calls=False,
                )
            )
        return models

    async def chat_completion(self, request: ChatCompletionRequest) -> ChatCompletionResponse:
        async with httpx.AsyncClient(timeout=60) as client:
            payload: dict[str, Any] = {
                "model": request.model,
                "messages": [{"role": m.role.value, "content": m.content} for m in request.messages],
                "stream": False,
                "options": {"temperature": request.temperature},
            }
            if request.max_tokens is not None:
                payload["options"]["num_predict"] = request.max_tokens
            resp = await client.post(f"{self._base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
        message = data.get("message", {})
        return ChatCompletionResponse(
            id=data.get("model", request.model),
            provider="ollama",
            model=request.model,
            message=ChatMessage(
                role=ChatRole(message.get("role", "assistant")),
                content=message.get("content", ""),
            ),
            usage=TokenUsage(
                prompt_tokens=data.get("prompt_eval_count", 0),
                completion_tokens=data.get("eval_count", 0),
                total_tokens=data.get("prompt_eval_count", 0) + data.get("eval_count", 0),
            ),
            created_at=datetime.now(timezone.utc),
        )

    async def create_embeddings(self, request: EmbeddingRequest) -> EmbeddingResponse:
        async with httpx.AsyncClient(timeout=30) as client:
            payload = {"model": request.model, "input": request.input}
            resp = await client.post(f"{self._base_url}/api/embed", json=payload)
            resp.raise_for_status()
            data = resp.json()
        embeddings = data.get("embeddings", [])
        return EmbeddingResponse(
            provider="ollama",
            model=request.model,
            embeddings=embeddings,
            usage=TokenUsage(prompt_tokens=0, completion_tokens=0, total_tokens=0),
        )


def get_adapter(provider: str, settings: Any) -> AIAdapter:
    if provider == "openai":
        return OpenAIAdapter(api_key=settings.openai_api_key, base_url=settings.openai_base_url)
    if provider == "gemini":
        return GeminiAdapter(api_key=settings.gemini_api_key, base_url=settings.gemini_base_url)
    if provider == "ollama":
        return OllamaAdapter(base_url=settings.ollama_base_url)
    raise ValueError(f"Unknown AI provider: {provider}")
