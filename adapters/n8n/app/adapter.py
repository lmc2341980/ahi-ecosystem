from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class N8nConfig:
    base_url: str
    api_key: str
    timeout: int = 30


class N8nAdapter:
    """Adapter for the n8n REST API."""

    def __init__(self, config: N8nConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._headers = {
            "X-N8N-API-KEY": config.api_key,
            "Accept": "application/json",
            "Content-Type": "application/json",
        }

    async def list_workflows(self) -> list[dict[str, Any]]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(f"{self._base_url}/api/v1/workflows", headers=self._headers)
            resp.raise_for_status()
            return resp.json()

    async def get_workflow(self, workflow_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(
                f"{self._base_url}/api/v1/workflows/{workflow_id}", headers=self._headers
            )
            resp.raise_for_status()
            return resp.json()

    async def activate_workflow(self, workflow_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/api/v1/workflows/{workflow_id}/activate", headers=self._headers
            )
            resp.raise_for_status()
            return resp.json()

    async def deactivate_workflow(self, workflow_id: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/api/v1/workflows/{workflow_id}/deactivate", headers=self._headers
            )
            resp.raise_for_status()
            return resp.json()

    async def trigger_webhook(
        self, webhook_id: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/webhook/{webhook_id}", headers=self._headers, json=data
            )
            resp.raise_for_status()
            return resp.json()

    async def list_executions(self, limit: int = 20) -> list[dict[str, Any]]:
        params = {"limit": str(limit)}
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(
                f"{self._base_url}/api/v1/executions", headers=self._headers, params=params
            )
            resp.raise_for_status()
            return resp.json().get("data", [])
