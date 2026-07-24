import type { AhiWorkspace, AhiWorkspaceMessage, AhiPerson, AhiOrganization, AhiGeographic, AhiConstitutionArticle, AhiVerification, AhiLegacyModel, AhiEvaluation, PaginatedResponse } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class AhiEcosystemClient {
    private readonly client;
    constructor(client: HttpClient);
    listWorkspaces(page?: number, pageSize?: number): Promise<PaginatedResponse<AhiWorkspace>>;
    createWorkspace(input: {
        name: string;
        ownerType: 'person' | 'organization';
        ownerId: string;
    }): Promise<AhiWorkspace>;
    listWorkspaceMessages(workspaceId: string): Promise<AhiWorkspaceMessage[]>;
    sendWorkspaceMessage(workspaceId: string, input: {
        entityType: 'human' | 'ai';
        role: 'user' | 'assistant' | 'system';
        content: string;
        tokenCount?: number;
    }): Promise<AhiWorkspaceMessage>;
    orchestrate(input: {
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
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
        evaluation: {
            score: number;
            decision: string;
            reasoning: string;
        };
    }>;
    evaluateMessage(input: {
        workspaceMessageId: string;
        score: number;
        decision: 'approved' | 'rejected' | 'needs_review';
        reasoning?: string;
    }): Promise<AhiEvaluation>;
    listLegacyModels(): Promise<AhiLegacyModel[]>;
    registerLegacyModel(input: {
        ahiName: string;
        originalName: string;
        provider: string;
        isFreeTier?: boolean;
    }): Promise<AhiLegacyModel>;
    listPersons(page?: number, pageSize?: number): Promise<PaginatedResponse<AhiPerson>>;
    createPerson(input: {
        email: string;
        displayName: string;
        ahiCode?: string;
        countryCode?: string;
        verificationLevel?: string;
    }): Promise<AhiPerson>;
    getPerson(id: string): Promise<AhiPerson>;
    listAhiOrganizations(page?: number, pageSize?: number): Promise<PaginatedResponse<AhiOrganization>>;
    createAhiOrganization(input: {
        name: string;
        slug: string;
        description?: string;
        createdBy?: string;
        governanceType?: string;
        countryCode?: string;
    }): Promise<AhiOrganization>;
    listGeographic(): Promise<AhiGeographic[]>;
    createGeographic(input: {
        countryCode: string;
        countryName: string;
        regionName?: string;
        governanceType?: string;
    }): Promise<AhiGeographic>;
    listVerifications(entityType?: string, page?: number, pageSize?: number): Promise<PaginatedResponse<AhiVerification>>;
    createVerification(input: {
        entityType: string;
        entityId: string;
        verifierId?: string;
        status?: string;
        findings?: string;
    }): Promise<AhiVerification>;
    listConstitution(): Promise<AhiConstitutionArticle[]>;
    setL1Cache(input: {
        key: string;
        value: Record<string, unknown>;
        ttlSeconds?: number;
    }): Promise<unknown>;
    getL1Cache(key: string): Promise<unknown>;
}
//# sourceMappingURL=ahi-ecosystem-client.d.ts.map