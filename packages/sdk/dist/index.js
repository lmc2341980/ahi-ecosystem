import { loadConfig } from '@ahi/shared';
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
export { HttpClient, SdkError } from './http-client';
export { KnowledgeClient } from './knowledge-client';
export { OrganizationClient } from './organization-client';
export { AhiEcosystemClient } from './ahi-ecosystem-client';
export class AhiSdk {
    config;
    http;
    organizations;
    ai;
    conversations;
    knowledge;
    erp;
    ahi;
    constructor(config) {
        this.config = config ?? loadConfig();
        this.http = new HttpClient({
            baseUrl: this.config.apiBaseUrl,
            timeoutMs: 10_000,
        });
        this.organizations = new OrganizationClient(this.http);
        const aiClient = new HttpClient({
            baseUrl: this.config.services.ai.baseUrl,
            timeoutMs: this.config.services.ai.timeoutMs,
        });
        this.ai = new AiClient(aiClient);
        this.conversations = new ConversationClient(aiClient);
        this.ahi = new AhiEcosystemClient(aiClient);
        this.knowledge = new KnowledgeClient(new HttpClient({
            baseUrl: this.config.services.knowledge.baseUrl,
            timeoutMs: this.config.services.knowledge.timeoutMs,
        }));
        this.erp = new ErpClient(new HttpClient({
            baseUrl: this.config.services.erp.baseUrl,
            timeoutMs: this.config.services.erp.timeoutMs,
        }));
    }
    setAuthToken(token) {
        this.http.setAuthToken(token);
        this.ai['client'].setAuthToken(token);
        this.conversations['client'].setAuthToken(token);
        this.ahi['client'].setAuthToken(token);
        this.knowledge['client'].setAuthToken(token);
        this.erp['client'].setAuthToken(token);
    }
}
export function createSdk(config) {
    return new AhiSdk(config);
}
//# sourceMappingURL=index.js.map