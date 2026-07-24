import type {
  AddDocumentInput,
  CreateKnowledgeBaseInput,
  IndexDocumentResponse,
  KnowledgeBase,
  KnowledgeDocument,
  KnowledgeSearchResult,
  PaginatedResponse,
  PaginationParams,
  SearchKnowledgeInput,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class KnowledgeClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async listKnowledgeBases(
    params?: PaginationParams,
  ): Promise<PaginatedResponse<KnowledgeBase>> {
    return this.client.getPaginated<KnowledgeBase>('/api/v1/knowledge-bases', params);
  }

  async getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    return this.client.get<KnowledgeBase>(`/api/v1/knowledge-bases/${id}`);
  }

  async createKnowledgeBase(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase> {
    return this.client.post<KnowledgeBase>('/api/v1/knowledge-bases', input);
  }

  async deleteKnowledgeBase(id: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/knowledge-bases/${id}`);
  }

  async listDocuments(
    kbId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<KnowledgeDocument>> {
    return this.client.getPaginated<KnowledgeDocument>(
      `/api/v1/knowledge-bases/${kbId}/documents`,
      params,
    );
  }

  async deleteDocument(kbId: string, docId: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`);
  }

  async search(input: SearchKnowledgeInput): Promise<KnowledgeSearchResult[]> {
    return this.client.post<KnowledgeSearchResult[]>('/api/v1/knowledge/search', input);
  }

  async addDocument(
    kbId: string,
    input: AddDocumentInput,
  ): Promise<IndexDocumentResponse> {
    return this.client.post<IndexDocumentResponse>(
      `/api/v1/knowledge-bases/${kbId}/documents`,
      input,
    );
  }
}
