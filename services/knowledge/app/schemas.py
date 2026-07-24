from __future__ import annotations

from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeBaseStatus(str, Enum):
    active = "active"
    indexing = "indexing"
    error = "error"


class DocumentStatus(str, Enum):
    pending = "pending"
    indexed = "indexed"
    failed = "failed"


class KnowledgeBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    name: str
    description: str | None = None
    document_count: int = 0
    status: KnowledgeBaseStatus = KnowledgeBaseStatus.active
    embedding_provider: str = "openai"
    embedding_model: str = "text-embedding-3-small"
    created_at: datetime
    updated_at: datetime


class KnowledgeDocument(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    knowledge_base_id: UUID
    title: str
    source: str
    mime_type: str
    size_bytes: int
    status: DocumentStatus
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class CreateKnowledgeBaseInput(BaseModel):
    organization_id: UUID = Field(default=UUID("00000000-0000-0000-0000-000000000000"))
    name: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class AddDocumentInput(BaseModel):
    knowledge_base_id: UUID
    title: str = Field(min_length=1, max_length=500)
    content: str = Field(min_length=1)
    mime_type: str = Field(default="text/plain")


class IndexDocumentResponse(BaseModel):
    document_id: UUID
    chunk_count: int
    status: DocumentStatus


class SearchKnowledgeInput(BaseModel):
    knowledge_base_id: UUID
    query: str = Field(min_length=1)
    top_k: int = Field(default=5, ge=1, le=50)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)


class KnowledgeSearchResult(BaseModel):
    document_id: UUID
    chunk_id: str
    content: str
    score: float
    metadata: dict[str, object] = {}


class PaginatedResponse(BaseModel):
    data: list
    total: int
    page: int
    page_size: int
