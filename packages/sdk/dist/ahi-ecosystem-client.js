export class AhiEcosystemClient {
    client;
    constructor(client) {
        this.client = client;
    }
    // AHI-WS: Workspaces
    async listWorkspaces(page = 1, pageSize = 20) {
        return this.client.get('/api/v1/ahi/workspaces', { page, page_size: pageSize });
    }
    async createWorkspace(input) {
        return this.client.post('/api/v1/ahi/workspaces', input);
    }
    async listWorkspaceMessages(workspaceId) {
        return this.client.get(`/api/v1/ahi/workspaces/${workspaceId}/messages`);
    }
    async sendWorkspaceMessage(workspaceId, input) {
        return this.client.post(`/api/v1/ahi/workspaces/${workspaceId}/messages`, { workspace_id: workspaceId, ...input });
    }
    // AHI-Or: Orchestration
    async orchestrate(input) {
        return this.client.post('/api/v1/ahi/orchestrate', input);
    }
    // AHI-SuBiet: Evaluation
    async evaluateMessage(input) {
        return this.client.post('/api/v1/ahi/evaluate', input);
    }
    // AHI-Old: Legacy models
    async listLegacyModels() {
        return this.client.get('/api/v1/ahi/legacy-models');
    }
    async registerLegacyModel(input) {
        return this.client.post('/api/v1/ahi/legacy-models', input);
    }
    // AHI-P: Persons
    async listPersons(page = 1, pageSize = 20) {
        return this.client.get('/api/v1/ahi/persons', { page, page_size: pageSize });
    }
    async createPerson(input) {
        return this.client.post('/api/v1/ahi/persons', input);
    }
    async getPerson(id) {
        return this.client.get(`/api/v1/ahi/persons/${id}`);
    }
    // AHI-O: Organizations
    async listAhiOrganizations(page = 1, pageSize = 20) {
        return this.client.get('/api/v1/ahi/organizations', { page, page_size: pageSize });
    }
    async createAhiOrganization(input) {
        return this.client.post('/api/v1/ahi/organizations', input);
    }
    // AHI-G: Geographic
    async listGeographic() {
        return this.client.get('/api/v1/ahi/geographic');
    }
    async createGeographic(input) {
        return this.client.post('/api/v1/ahi/geographic', input);
    }
    // AHI-V: Verifications
    async listVerifications(entityType, page = 1, pageSize = 20) {
        return this.client.get('/api/v1/ahi/verifications', { entity_type: entityType, page, page_size: pageSize });
    }
    async createVerification(input) {
        return this.client.post('/api/v1/ahi/verifications', input);
    }
    // AHI-Core: Constitution
    async listConstitution() {
        return this.client.get('/api/v1/ahi/constitution');
    }
    // AHI-Cache: L1
    async setL1Cache(input) {
        return this.client.post('/api/v1/ahi/cache/l1', input);
    }
    async getL1Cache(key) {
        return this.client.get(`/api/v1/ahi/cache/l1/${key}`);
    }
}
//# sourceMappingURL=ahi-ecosystem-client.js.map