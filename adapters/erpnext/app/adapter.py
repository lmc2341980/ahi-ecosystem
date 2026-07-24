from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx


@dataclass
class ERPNextConfig:
    base_url: str
    api_key: str
    api_secret: str
    timeout: int = 30


class ERPNextAdapter:
    """Adapter for the ERPNext REST API."""

    def __init__(self, config: ERPNextConfig) -> None:
        self._config = config
        self._base_url = config.base_url.rstrip("/")
        self._headers = {
            "Authorization": f"token {config.api_key}:{config.api_secret}",
            "Accept": "application/json",
        }

    async def list_customers(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict[str, Any]], int]:
        return await self._list_resource("Customer", page, page_size)

    async def list_items(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict[str, Any]], int]:
        return await self._list_resource("Item", page, page_size)

    async def list_invoices(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict[str, Any]], int]:
        return await self._list_resource("Sales Invoice", page, page_size)

    async def get_resource(self, doctype: str, name: str) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(
                f"{self._base_url}/api/resource/{doctype}/{name}", headers=self._headers
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    async def create_resource(self, doctype: str, data: dict[str, Any]) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.post(
                f"{self._base_url}/api/resource/{doctype}", headers=self._headers, json=data
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    async def update_resource(
        self, doctype: str, name: str, data: dict[str, Any]
    ) -> dict[str, Any]:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.put(
                f"{self._base_url}/api/resource/{doctype}/{name}", headers=self._headers, json=data
            )
            resp.raise_for_status()
            return resp.json().get("data", {})

    async def delete_resource(self, doctype: str, name: str) -> None:
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.delete(
                f"{self._base_url}/api/resource/{doctype}/{name}", headers=self._headers
            )
            resp.raise_for_status()

    async def _list_resource(
        self, doctype: str, page: int, page_size: int
    ) -> tuple[list[dict[str, Any]], int]:
        limit_start = (page - 1) * page_size
        params = {
            "limit_page_length": str(page_size),
            "limit_start": str(limit_start),
        }
        async with httpx.AsyncClient(timeout=self._config.timeout) as client:
            resp = await client.get(
                f"{self._base_url}/api/resource/{doctype}", headers=self._headers, params=params
            )
            resp.raise_for_status()
            data = resp.json()
        items = data.get("data", [])
        total = data.get("total_count", len(items))
        return items, total
