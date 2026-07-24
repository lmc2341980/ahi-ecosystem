import { type AppConfig } from '@ahi/shared';
import { HttpClient } from './http-client';
import { AiClient } from './ai-client';
import { ErpClient } from './erp-client';
import { KnowledgeClient } from './knowledge-client';
import { OrganizationClient } from './organization-client';
import { ConversationClient } from './conversation-client';
import { AhiEcosystemClient } from './ahi-ecosystem-client';
export { AiClient } from './ai-client';
export { ConversationClient } from './conversation-client';
export { ErpClient } from './erp-client';
export { HttpClient, SdkError, type HttpClientOptions } from './http-client';
export { KnowledgeClient } from './knowledge-client';
export { OrganizationClient } from './organization-client';
export { AhiEcosystemClient } from './ahi-ecosystem-client';
export declare class AhiSdk {
    readonly config: AppConfig;
    readonly http: HttpClient;
    readonly organizations: OrganizationClient;
    readonly ai: AiClient;
    readonly conversations: ConversationClient;
    readonly knowledge: KnowledgeClient;
    readonly erp: ErpClient;
    readonly ahi: AhiEcosystemClient;
    constructor(config?: AppConfig);
    setAuthToken(token: string): void;
}
export declare function createSdk(config?: AppConfig): AhiSdk;
//# sourceMappingURL=index.d.ts.map