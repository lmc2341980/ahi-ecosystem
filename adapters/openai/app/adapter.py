from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class OpenAIConfig:
    api_key: str
    base_url: str = "https://api.openai.com/v1"
    timeout: int = 60


class OpenAIAdapter:
    """Adapter for the OpenAI API."""

    def __init__(self, config: OpenAIConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {config.api_key}",
            "Content-Type": "application/json",
        }

    async def list_models(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/models", headers=self._headers)
            resp.raise_for_status()
            return resp.json().get("data", [])

    async def create_chat_completion(
        self,
        model: str,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        stream: bool = False,
        tools: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "stream": stream,
        }
        if max_tokens is not None:
            payload["max_tokens"] = max_tokens
        if tools is not None:
            payload["tools"] = tools
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/chat/completions", headers=self._headers, json=payload
            )
            resp.raise_for_status()
            return resp.json()

    async def create_embeddings(
        self, model: str, input_data: str | list[str]
    ) -> dict[str, Any]:
        payload = {"model": model, "input": input_data}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/embeddings", headers=self._headers, json=payload
            )
            resp.raise_for_status()
            return resp.json()

    async def create_image(
        self,
        model: str,
        prompt: str,
        n: int = 1,
        size: str = "1024x1024",
    ) -> dict[str, Any]:
        payload = {"model": model, "prompt": prompt, "n": n, "size": size}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/images/generations", headers=self._headers, json=payload
            )
            resp.raise_for_status()
            return resp.json()

    async def transcribe_audio(self, model: str, file_path: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            with open(file_path, "rb") as f:
                files = {"file": f}
                headers = {"Authorization": f"Bearer {self._config.api_key}"}
                resp = await client.post(
                    f"{self._base_url}/audio/transcriptions",
                    headers=headers,
                    data={"model": model},
                    files=files,
                )
            resp.raise_for_status()
            return resp.json()
