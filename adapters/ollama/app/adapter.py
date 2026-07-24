from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class OllamaConfig:
    base_url: str = "http://localhost:11434"
    timeout: int = 60


class OllamaAdapter:
    """Adapter for the Ollama API."""

    def __init__(self, config: OllamaConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._headers = {"Content-Type": "application/json"}

    async def list_models(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/api/tags")
            resp.raise_for_status()
            return resp.json().get("models", [])

    async def chat(
        self,
        model: str,
        messages: list[dict[str, str]],
        stream: bool = False,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "stream": stream,
        }
        if options:
            payload["options"] = options
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(f"{self._base_url}/api/chat", headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def generate(
        self,
        model: str,
        prompt: str,
        stream: bool = False,
        options: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "prompt": prompt,
            "stream": stream,
        }
        if options:
            payload["options"] = options
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(f"{self._base_url}/api/generate", headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def create_embedding(
        self, model: str, input_data: str | list[str]
    ) -> dict[str, Any]:
        payload = {"model": model, "input": input_data}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(f"{self._base_url}/api/embed", headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def pull_model(self, model: str) -> dict[str, Any]:
        payload = {"name": model}
        async with httpx.AsyncClient(timeout=300) as client:
            resp = await client.post(f"{self._base_url}/api/pull", headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()

    async def delete_model(self, model: str) -> None:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.delete(
                f"{self._base_url}/api/delete", headers=self._headers, json={"name": model}
            )
            resp.raise_for_status()

    async def show_model_info(self, model: str) -> dict[str, Any]:
        payload = {"name": model}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(f"{self._base_url}/api/show", headers=self._headers, json=payload)
            resp.raise_for_status()
            return resp.json()
