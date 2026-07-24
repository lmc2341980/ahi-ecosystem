export class KnowledgeClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async listKnowledgeBases(params) {
        return this.client.getPaginated('/api/v1/knowledge-bases', params);
    }
    async getKnowledgeBase(id) {
        return this.client.get(`/api/v1/knowledge-bases/${id}`);
    }
    async createKnowledgeBase(input) {
        return this.client.post('/api/v1/knowledge-bases', input);
    }
    async deleteKnowledgeBase(id) {
        await this.client.delete(`/api/v1/knowledge-bases/${id}`);
    }
    async listDocuments(kbId, params) {
        return this.client.getPaginated(`/api/v1/knowledge-bases/${kbId}/documents`, params);
    }
    async deleteDocument(kbId, docId) {
        await this.client.delete(`/api/v1/knowledge-bases/${kbId}/documents/${docId}`);
    }
    async search(input) {
        return this.client.post('/api/v1/knowledge/search', input);
    }
    async addDocument(kbId, input) {
        return this.client.post(`/api/v1/knowledge-bases/${kbId}/documents`, input);
    }
}
//# sourceMappingURL=knowledge-client.js.map