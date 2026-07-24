from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class OpenWebUIConfig:
    base_url: str
    api_key: str
    timeout: int = 30


class OpenWebUIAdapter:
    """Adapter for the Open WebUI API."""

    def __init__(self, config: OpenWebUIConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def list_models(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/api/models", headers=self._headers)
            resp.raise_for_status()
            data = resp.json()
        if isinstance(data, dict):
            return data.get("data", [])
        return data

    async def create_chat_completion(
        self, model: str, messages: list[dict[str, str]], **kwargs: Any
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {"model": model, "messages": messages}
        payload.update(kwargs)
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/api/chat/completions", headers=self._headers, json=payload
            )
            resp.raise_for_status()
            return resp.json()

    async def get_user(self) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/api/user", headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def list_knowledge_bases(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/api/knowledge", headers=self._headers)
            resp.raise_for_status()
            return resp.json()
