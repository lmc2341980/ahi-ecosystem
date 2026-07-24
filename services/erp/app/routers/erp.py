from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query, status

from .adapters import get_erp_adapter
from .config import get_settings
from .schemas import (
    ERPCustomer,
    ERPInvoice,
    ERPItem,
    ERPSyncRequest,
    ERPSyncStatus,
    PaginatedResponse,
)

router = APIRouter(prefix="/api/v1/erp", tags=["erp"])
settings = get_settings()


@router.get("/customers", response_model=PaginatedResponse)
async def list_customers(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    adapter = get_erp_adapter("erpnext", settings)
    items, total = await adapter.list_customers(page=page, page_size=page_size)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/items", response_model=PaginatedResponse)
async def list_items(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    adapter = get_erp_adapter("erpnext", settings)
    items, total = await adapter.list_items(page=page, page_size=page_size)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/invoices", response_model=PaginatedResponse)
async def list_invoices(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    adapter = get_erp_adapter("erpnext", settings)
    items, total = await adapter.list_invoices(page=page, page_size=page_size)
    return {"data": items, "total": total, "page": page, "page_size": page_size}


@router.get("/sync/{system}/status", response_model=ERPSyncStatus)
async def get_sync_status(system: str) -> ERPSyncStatus:
    try:
        adapter = get_erp_adapter(system, settings)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return await adapter.get_sync_status()


@router.post("/sync", response_model=ERPSyncStatus)
async def trigger_sync(request: ERPSyncRequest) -> ERPSyncStatus:
    try:
        adapter = get_erp_adapter(request.system.value, settings)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    return await adapter.get_sync_status()
