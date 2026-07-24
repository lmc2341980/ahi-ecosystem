import type { AddDocumentInput, CreateKnowledgeBaseInput, IndexDocumentResponse, KnowledgeBase, KnowledgeDocument, KnowledgeSearchResult, PaginatedResponse, PaginationParams, SearchKnowledgeInput } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class KnowledgeClient {
    private readonly client;
    constructor(client: HttpClient);
    listKnowledgeBases(params?: PaginationParams): Promise<PaginatedResponse<KnowledgeBase>>;
    getKnowledgeBase(id: string): Promise<KnowledgeBase>;
    createKnowledgeBase(input: CreateKnowledgeBaseInput): Promise<KnowledgeBase>;
    deleteKnowledgeBase(id: string): Promise<void>;
    listDocuments(kbId: string, params?: PaginationParams): Promise<PaginatedResponse<KnowledgeDocument>>;
    deleteDocument(kbId: string, docId: string): Promise<void>;
    search(input: SearchKnowledgeInput): Promise<KnowledgeSearchResult[]>;
    addDocument(kbId: string, input: AddDocumentInput): Promise<IndexDocumentResponse>;
}
//# sourceMappingURL=knowledge-client.d.ts.map