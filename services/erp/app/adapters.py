from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any

import httpx

from .schemas import ERPCustomer, ERPItem, ERPInvoice, ERPSyncStatus, ERPSystem


class ERPAdapter(ABC):
    """Abstract base class for ERP system adapters."""

    system: ERPSystem

    @abstractmethod
    async def list_customers(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPCustomer], int]:
        ...

    @abstractmethod
    async def list_items(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPItem], int]:
        ...

    @abstractmethod
    async def list_invoices(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPInvoice], int]:
        ...

    @abstractmethod
    async def get_sync_status(self) -> ERPSyncStatus:
        ...


class ERPNextAdapter(ERPAdapter):
    system = ERPSystem.erpnext

    def __init__(self, base_url: str, api_key: str, api_secret: str) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._api_secret = api_secret

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"token {self._api_key}:{self._api_secret}",
            "Accept": "application/json",
        }

    async def _fetch_list(
        self, doctype: str, page: int, page_size: int, fields: list[str]
    ) -> tuple[list[dict[str, Any]], int]:
        if not self._base_url or not self._api_key:
            return [], 0
        limit_start = (page - 1) * page_size
        params = {
            "limit_page_length": str(page_size),
            "limit_start": str(limit_start),
            "fields": str(fields),
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(
                f"{self._base_url}/api/resource/{doctype}", headers=self._headers(), params=params
            )
            resp.raise_for_status()
            data = resp.json()
        items = data.get("data", [])
        total = data.get("total_count", len(items))
        return items, total

    async def list_customers(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPCustomer], int]:
        rows, total = await self._fetch_list(
            "Customer", page, page_size, ["name", "customer_name", "email_id", "mobile_no", "default_currency"]
        )
        now = datetime.now(timezone.utc)
        customers = [
            ERPCustomer(
                id=row.get("name", ""),
                system=ERPSystem.erpnext,
                name=row.get("customer_name", ""),
                email=row.get("email_id"),
                phone=row.get("mobile_no"),
                currency=row.get("default_currency", "USD"),
                credit_limit=0.0,
                created_at=now,
                updated_at=now,
            )
            for row in rows
        ]
        return customers, total

    async def list_items(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPItem], int]:
        rows, total = await self._fetch_list(
            "Item", page, page_size, ["name", "item_name", "item_code", "description", "standard_rate", "stock_uom"]
        )
        now = datetime.now(timezone.utc)
        items = [
            ERPItem(
                id=row.get("name", ""),
                system=ERPSystem.erpnext,
                name=row.get("item_name", ""),
                sku=row.get("item_code", ""),
                description=row.get("description"),
                unit_price=float(row.get("standard_rate", 0)),
                currency="USD",
                stock_quantity=0,
                created_at=now,
                updated_at=now,
            )
            for row in rows
        ]
        return items, total

    async def list_invoices(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPInvoice], int]:
        rows, total = await self._fetch_list(
            "Sales Invoice", page, page_size, ["name", "customer", "status", "grand_total", "posting_date", "due_date"]
        )
        invoices = [
            ERPInvoice(
                id=row.get("name", ""),
                system=ERPSystem.erpnext,
                number=row.get("name", ""),
                customer_id=row.get("customer", ""),
                status=row.get("status", "draft"),
                total=float(row.get("grand_total", 0)),
                currency="USD",
                issue_date=row.get("posting_date", ""),
                due_date=row.get("due_date", ""),
            )
            for row in rows
        ]
        return invoices, total

    async def get_sync_status(self) -> ERPSyncStatus:
        return ERPSyncStatus(
            system=ERPSystem.erpnext,
            last_sync_at=None,
            status="idle" if self._api_key else "error",
            records_processed=0,
            error_message=None if self._api_key else "ERPNext API credentials not configured",
        )


class InternalERPAdapter(ERPAdapter):
    system = ERPSystem.internal

    async def list_customers(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPCustomer], int]:
        return [], 0

    async def list_items(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPItem], int]:
        return [], 0

    async def list_invoices(self, page: int = 1, page_size: int = 20) -> tuple[list[ERPInvoice], int]:
        return [], 0

    async def get_sync_status(self) -> ERPSyncStatus:
        return ERPSyncStatus(system=ERPSystem.internal, status="idle", records_processed=0)


def get_erp_adapter(system: str, settings: Any) -> ERPAdapter:
    if system == "erpnext":
        return ERPNextAdapter(
            base_url=settings.erpnext_base_url,
            api_key=settings.erpnext_api_key,
            api_secret=settings.erpnext_api_secret,
        )
    if system == "internal":
        return InternalERPAdapter()
    raise ValueError(f"Unknown ERP system: {system}")
