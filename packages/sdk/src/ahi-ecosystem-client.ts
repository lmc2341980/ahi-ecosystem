import type {
  AhiWorkspace,
  AhiWorkspaceMessage,
  AhiPerson,
  AhiOrganization,
  AhiGeographic,
  AhiConstitutionArticle,
  AhiVerification,
  AhiLegacyModel,
  AhiEvaluation,
  PaginatedResponse,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class AhiEcosystemClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  // AHI-WS: Workspaces
  async listWorkspaces(page = 1, pageSize = 20): Promise<PaginatedResponse<AhiWorkspace>> {
    return this.client.get<PaginatedResponse<AhiWorkspace>>('/api/v1/ahi/workspaces', { page, page_size: pageSize });
  }

  async createWorkspace(input: { name: string; ownerType: 'person' | 'organization'; ownerId: string }): Promise<AhiWorkspace> {
    return this.client.post<AhiWorkspace>('/api/v1/ahi/workspaces', input);
  }

  async listWorkspaceMessages(workspaceId: string): Promise<AhiWorkspaceMessage[]> {
    return this.client.get<AhiWorkspaceMessage[]>(`/api/v1/ahi/workspaces/${workspaceId}/messages`);
  }

  async sendWorkspaceMessage(workspaceId: string, input: {
    entityType: 'human' | 'ai';
    role: 'user' | 'assistant' | 'system';
    content: string;
    tokenCount?: number;
  }): Promise<AhiWorkspaceMessage> {
    return this.client.post<AhiWorkspaceMessage>(
      `/api/v1/ahi/workspaces/${workspaceId}/messages`,
      { workspace_id: workspaceId, ...input },
    );
  }

  // AHI-Or: Orchestration
  async orchestrate(input: {
    workspaceId: string;
    message: string;
    strategy?: 'single' | 'multi_aggregate' | 'fallback';
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    user_message_id: string;
    ai_message_id: string;
    response: string;
    model: string;
    strategy: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
    evaluation: { score: number; decision: string; reasoning: string };
  }> {
    return this.client.post('/api/v1/ahi/orchestrate', input);
  }

  // AHI-SuBiet: Evaluation
  async evaluateMessage(input: {
    workspaceMessageId: string;
    score: number;
    decision: 'approved' | 'rejected' | 'needs_review';
    reasoning?: string;
  }): Promise<AhiEvaluation> {
    return this.client.post<AhiEvaluation>('/api/v1/ahi/evaluate', input);
  }

  // AHI-Old: Legacy models
  async listLegacyModels(): Promise<AhiLegacyModel[]> {
    return this.client.get<AhiLegacyModel[]>('/api/v1/ahi/legacy-models');
  }

  async registerLegacyModel(input: {
    ahiName: string;
    originalName: string;
    provider: string;
    isFreeTier?: boolean;
  }): Promise<AhiLegacyModel> {
    return this.client.post<AhiLegacyModel>('/api/v1/ahi/legacy-models', input);
  }

  // AHI-P: Persons
  async listPersons(page = 1, pageSize = 20): Promise<PaginatedResponse<AhiPerson>> {
    return this.client.get<PaginatedResponse<AhiPerson>>('/api/v1/ahi/persons', { page, page_size: pageSize });
  }

  async createPerson(input: {
    email: string;
    displayName: string;
    ahiCode?: string;
    countryCode?: string;
    verificationLevel?: string;
  }): Promise<AhiPerson> {
    return this.client.post<AhiPerson>('/api/v1/ahi/persons', input);
  }

  async getPerson(id: string): Promise<AhiPerson> {
    return this.client.get<AhiPerson>(`/api/v1/ahi/persons/${id}`);
  }

  // AHI-O: Organizations
  async listAhiOrganizations(page = 1, pageSize = 20): Promise<PaginatedResponse<AhiOrganization>> {
    return this.client.get<PaginatedResponse<AhiOrganization>>('/api/v1/ahi/organizations', { page, page_size: pageSize });
  }

  async createAhiOrganization(input: {
    name: string;
    slug: string;
    description?: string;
    createdBy?: string;
    governanceType?: string;
    countryCode?: string;
  }): Promise<AhiOrganization> {
    return this.client.post<AhiOrganization>('/api/v1/ahi/organizations', input);
  }

  // AHI-G: Geographic
  async listGeographic(): Promise<AhiGeographic[]> {
    return this.client.get<AhiGeographic[]>('/api/v1/ahi/geographic');
  }

  async createGeographic(input: {
    countryCode: string;
    countryName: string;
    regionName?: string;
    governanceType?: string;
  }): Promise<AhiGeographic> {
    return this.client.post<AhiGeographic>('/api/v1/ahi/geographic', input);
  }

  // AHI-V: Verifications
  async listVerifications(entityType?: string, page = 1, pageSize = 20): Promise<PaginatedResponse<AhiVerification>> {
    return this.client.get<PaginatedResponse<AhiVerification>>('/api/v1/ahi/verifications', { entity_type: entityType, page, page_size: pageSize });
  }

  async createVerification(input: {
    entityType: string;
    entityId: string;
    verifierId?: string;
    status?: string;
    findings?: string;
  }): Promise<AhiVerification> {
    return this.client.post<AhiVerification>('/api/v1/ahi/verifications', input);
  }

  // AHI-Core: Constitution
  async listConstitution(): Promise<AhiConstitutionArticle[]> {
    return this.client.get<AhiConstitutionArticle[]>('/api/v1/ahi/constitution');
  }

  // AHI-Cache: L1
  async setL1Cache(input: { key: string; value: Record<string, unknown>; ttlSeconds?: number }): Promise<unknown> {
    return this.client.post('/api/v1/ahi/cache/l1', input);
  }

  async getL1Cache(key: string): Promise<unknown> {
    return this.client.get(`/api/v1/ahi/cache/l1/${key}`);
  }
}
