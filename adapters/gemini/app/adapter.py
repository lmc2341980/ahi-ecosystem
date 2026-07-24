from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class GeminiConfig:
    api_key: str
    base_url: str = "https://generativelanguage.googleapis.com/v1beta"
    timeout: int = 60


class GeminiAdapter:
    """Adapter for the Google Gemini API."""

    def __init__(self, config: GeminiConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._params = {"key": config.api_key}

    async def list_models(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/models", params=self._params)
            resp.raise_for_status()
            return resp.json().get("models", [])

    async def generate_content(
        self,
        model: str,
        contents: list[dict[str, Any]],
        generation_config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"contents": contents}
        if generation_config:
            payload["generationConfig"] = generation_config
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/models/{model}:generateContent",
                params=self._params,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def stream_generate_content(
        self,
        model: str,
        contents: list[dict[str, Any]],
        generation_config: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"contents": contents}
        if generation_config:
            payload["generationConfig"] = generation_config
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/models/{model}:streamGenerateContent",
                params=self._params,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def embed_content(self, model: str, content: str) -> dict[str, Any]:
        payload = {
            "model": f"models/{model}",
            "content": {"parts": [{"text": content}]},
        }
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/models/{model}:embedContent",
                params=self._params,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()

    async def count_tokens(self, model: str, contents: list[dict[str, Any]]) -> dict[str, Any]:
        payload = {"contents": contents}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/models/{model}:countTokens",
                params=self._params,
                json=payload,
            )
            resp.raise_for_status()
            return resp.json()
