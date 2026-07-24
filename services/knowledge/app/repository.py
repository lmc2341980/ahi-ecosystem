from __future__ import annotations

import httpx
from uuid import UUID

from .database import get_supabase
from .schemas import (
    AddDocumentInput,
    CreateKnowledgeBaseInput,
    IndexDocumentResponse,
    KnowledgeBase,
    KnowledgeDocument,
    KnowledgeSearchResult,
    DocumentStatus,
)
from .config import get_settings

_settings = get_settings()

CHUNK_SIZE = 512
CHUNK_OVERLAP = 64


def _chunk_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    if len(text) <= chunk_size:
        return [text]
    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start = end - overlap
    return chunks


async def _create_embeddings(texts: list[str], provider: str = "openai", model: str = "text-embedding-3-small") -> list[list[float]]:
    url = f"{_settings.ai_service_base_url}/api/v1/ai/embeddings"
    payload = {"provider": provider, "model": model, "input": texts}
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    return data.get("embeddings", [])


class KnowledgeRepository:
    def __init__(self) -> None:
        self._db = get_supabase()

    def list_knowledge_bases(self, page: int = 1, page_size: int = 20) -> tuple[list[KnowledgeBase], int]:
        offset = (page - 1) * page_size
        count_resp = self._db.table("knowledge_bases").select("id", count="exact").execute()
        total = count_resp.count or 0
        resp = (
            self._db.table("knowledge_bases")
            .select("*")
            .order_by("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        items: list[KnowledgeBase] = []
        for row in resp.data:
            doc_count = (
                self._db.table("knowledge_documents")
                .select("id", count="exact")
                .eq("knowledge_base_id", row["id"])
                .execute()
                .count
                or 0
            )
            row["document_count"] = doc_count
            items.append(KnowledgeBase.model_validate(row))
        return items, total

    def get_knowledge_base(self, kb_id: UUID) -> KnowledgeBase | None:
        resp = (
            self._db.table("knowledge_bases")
            .select("*")
            .eq("id", str(kb_id))
            .maybe_execute()
            .execute()
        )
        if not resp.data:
            return None
        row = resp.data[0]
        doc_count = (
            self._db.table("knowledge_documents")
            .select("id", count="exact")
            .eq("knowledge_base_id", str(kb_id))
            .execute()
            .count
            or 0
        )
        row["document_count"] = doc_count
        return KnowledgeBase.model_validate(row)

    def create_knowledge_base(self, input_data: CreateKnowledgeBaseInput) -> KnowledgeBase:
        row = {
            "organization_id": str(input_data.organization_id),
            "name": input_data.name,
            "description": input_data.description,
        }
        resp = self._db.table("knowledge_bases").insert(row).execute()
        return KnowledgeBase.model_validate(resp.data[0])

    def delete_knowledge_base(self, kb_id: UUID) -> bool:
        resp = (
            self._db.table("knowledge_bases")
            .delete()
            .eq("id", str(kb_id))
            .execute()
        )
        return len(resp.data) > 0

    def list_documents(
        self, kb_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[KnowledgeDocument], int]:
        offset = (page - 1) * page_size
        count_resp = (
            self._db.table("knowledge_documents")
            .select("id", count="exact")
            .eq("knowledge_base_id", str(kb_id))
            .execute()
        )
        total = count_resp.count or 0
        resp = (
            self._db.table("knowledge_documents")
            .select("*")
            .eq("knowledge_base_id", str(kb_id))
            .order_by("created_at", desc=True)
            .range(offset, offset + page_size - 1)
            .execute()
        )
        return [KnowledgeDocument.model_validate(row) for row in resp.data], total

    def delete_document(self, kb_id: UUID, doc_id: UUID) -> bool:
        resp = (
            self._db.table("knowledge_documents")
            .delete()
            .eq("id", str(doc_id))
            .eq("knowledge_base_id", str(kb_id))
            .execute()
        )
        return len(resp.data) > 0

    async def add_document(self, input_data: AddDocumentInput) -> IndexDocumentResponse:
        kb = self.get_knowledge_base(input_data.knowledge_base_id)
        if kb is None:
            raise ValueError("Knowledge base not found")

        size_bytes = len(input_data.content.encode("utf-8"))
        doc_row = {
            "knowledge_base_id": str(input_data.knowledge_base_id),
            "title": input_data.title,
            "source": f"upload:{input_data.title}",
            "mime_type": input_data.mime_type,
            "size_bytes": size_bytes,
            "status": DocumentStatus.pending.value,
        }
        doc_resp = self._db.table("knowledge_documents").insert(doc_row).execute()
        doc_id = doc_resp.data[0]["id"]

        chunks = _chunk_text(input_data.content)
        try:
            embeddings = await _create_embeddings(
                chunks, provider=kb.embedding_provider, model=kb.embedding_model
            )
        except Exception:
            self._db.table("knowledge_documents").update({"status": DocumentStatus.failed.value}).eq("id", doc_id).execute()
            raise

        chunk_rows = []
        for i, (chunk_text, emb) in enumerate(zip(chunks, embeddings)):
            chunk_rows.append({
                "document_id": doc_id,
                "knowledge_base_id": str(input_data.knowledge_base_id),
                "chunk_index": i,
                "content": chunk_text,
                "embedding": emb,
            })

        if chunk_rows:
            self._db.table("knowledge_chunks").insert(chunk_rows).execute()

        self._db.table("knowledge_documents").update({
            "status": DocumentStatus.indexed.value,
            "chunk_count": len(chunks),
        }).eq("id", doc_id).execute()

        return IndexDocumentResponse(
            document_id=UUID(doc_id),
            chunk_count=len(chunks),
            status=DocumentStatus.indexed,
        )

    async def search(self, kb_id: UUID, query: str, top_k: int = 5, min_score: float = 0.0) -> list[KnowledgeSearchResult]:
        kb = self.get_knowledge_base(kb_id)
        if kb is None:
            raise ValueError("Knowledge base not found")

        embeddings = await _create_embeddings(
            [query], provider=kb.embedding_provider, model=kb.embedding_model
        )
        if not embeddings:
            return []

        query_embedding = embeddings[0]
        resp = self._db.rpc("match_knowledge", {
            "query_embedding": query_embedding,
            "kb_id": str(kb_id),
            "match_count": top_k,
            "min_score": min_score,
        }).execute()

        results: list[KnowledgeSearchResult] = []
        for row in resp.data:
            results.append(KnowledgeSearchResult(
                document_id=UUID(row["document_id"]),
                chunk_id=row["id"],
                content=row["content"],
                score=row["score"],
                metadata=row.get("metadata", {}),
            ))
        return results
