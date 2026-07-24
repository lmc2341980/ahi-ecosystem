from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from .repository import KnowledgeRepository
from .schemas import (
    AddDocumentInput,
    CreateKnowledgeBaseInput,
    IndexDocumentResponse,
    KnowledgeBase,
    KnowledgeDocument,
    KnowledgeSearchResult,
    SearchKnowledgeInput,
)

router = APIRouter(tags=["knowledge"])


def _get_repo() -> KnowledgeRepository:
    return KnowledgeRepository()


@router.get("/api/v1/knowledge-bases", response_model=dict)
def list_knowledge_bases(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    repo = _get_repo()
    items, total = repo.list_knowledge_bases(page=page, page_size=page_size)
    return {
        "data": [item.model_dump(mode="json") for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/api/v1/knowledge-bases/{kb_id}", response_model=KnowledgeBase)
def get_knowledge_base(kb_id: UUID) -> KnowledgeBase:
    repo = _get_repo()
    kb = repo.get_knowledge_base(kb_id)
    if kb is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")
    return kb


@router.post("/api/v1/knowledge-bases", response_model=KnowledgeBase, status_code=status.HTTP_201_CREATED)
def create_knowledge_base(input_data: CreateKnowledgeBaseInput) -> KnowledgeBase:
    repo = _get_repo()
    return repo.create_knowledge_base(input_data)


@router.delete("/api/v1/knowledge-bases/{kb_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_base(kb_id: UUID) -> None:
    repo = _get_repo()
    if not repo.delete_knowledge_base(kb_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Knowledge base not found")


@router.get("/api/v1/knowledge-bases/{kb_id}/documents", response_model=dict)
def list_documents(
    kb_id: UUID,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    repo = _get_repo()
    items, total = repo.list_documents(kb_id, page=page, page_size=page_size)
    return {
        "data": [item.model_dump(mode="json") for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.delete("/api/v1/knowledge-bases/{kb_id}/documents/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(kb_id: UUID, doc_id: UUID) -> None:
    repo = _get_repo()
    if not repo.delete_document(kb_id, doc_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")


@router.post("/api/v1/knowledge-bases/{kb_id}/documents", response_model=IndexDocumentResponse, status_code=status.HTTP_201_CREATED)
async def add_document(kb_id: UUID, input_data: AddDocumentInput) -> IndexDocumentResponse:
    if input_data.knowledge_base_id != kb_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Knowledge base ID mismatch")
    repo = _get_repo()
    try:
        return await repo.add_document(input_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Indexing failed: {exc}",
        )


@router.post("/api/v1/knowledge/search", response_model=list[KnowledgeSearchResult])
async def search_knowledge(input_data: SearchKnowledgeInput) -> list[KnowledgeSearchResult]:
    repo = _get_repo()
    try:
        return await repo.search(
            input_data.knowledge_base_id,
            input_data.query,
            top_k=input_data.top_k,
            min_score=input_data.min_score,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Search failed: {exc}",
        )
