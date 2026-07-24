import type { ISODateString, UUID } from './common';

export type KnowledgeBaseStatus = 'active' | 'indexing' | 'error';

export type DocumentStatus = 'pending' | 'indexed' | 'failed';

export interface KnowledgeBase {
  id: UUID;
  organizationId: UUID;
  name: string;
  description: string | null;
  documentCount: number;
  status: KnowledgeBaseStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface KnowledgeDocument {
  id: UUID;
  knowledgeBaseId: UUID;
  title: string;
  source: string;
  mimeType: string;
  sizeBytes: number;
  status: DocumentStatus;
  chunkCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateKnowledgeBaseInput {
  organizationId: UUID;
  name: string;
  description?: string;
}

export interface SearchKnowledgeInput {
  knowledgeBaseId: UUID;
  query: string;
  topK?: number;
  minScore?: number;
}

export interface KnowledgeChunk {
  id: UUID;
  documentId: UUID;
  chunkIndex: number;
  content: string;
  metadata: Record<string, unknown>;
}

export interface KnowledgeSearchResult {
  documentId: UUID;
  chunkId: string;
  content: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface AddDocumentInput {
  knowledgeBaseId: UUID;
  title: string;
  content: string;
  mimeType?: string;
}

export interface IndexDocumentResponse {
  documentId: UUID;
  chunkCount: number;
  status: DocumentStatus;
}
