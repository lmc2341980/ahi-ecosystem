from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ERPSystem(str, Enum):
    erpnext = "erpnext"
    internal = "internal"


class ERPEntityType(str, Enum):
    customer = "customer"
    supplier = "supplier"
    item = "item"
    invoice = "invoice"
    order = "order"


class ERPCustomer(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    system: ERPSystem
    name: str
    email: str | None = None
    phone: str | None = None
    currency: str = "USD"
    credit_limit: float = 0.0
    created_at: datetime
    updated_at: datetime


class ERPItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    system: ERPSystem
    name: str
    sku: str
    description: str | None = None
    unit_price: float
    currency: str = "USD"
    stock_quantity: int = 0
    created_at: datetime
    updated_at: datetime


class ERPInvoice(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    system: ERPSystem
    number: str
    customer_id: str
    status: str
    total: float
    currency: str = "USD"
    issue_date: datetime
    due_date: datetime


class ERPSyncStatus(BaseModel):
    system: ERPSystem
    last_sync_at: datetime | None = None
    status: str = "idle"
    records_processed: int = 0
    error_message: str | None = None


class ERPSyncRequest(BaseModel):
    system: ERPSystem
    entity_type: ERPEntityType
    full_sync: bool = False


class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int
