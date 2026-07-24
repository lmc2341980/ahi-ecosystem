export class AiClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async listModels() {
        return this.client.get('/api/v1/ai/models');
    }
    async chatCompletion(input) {
        return this.client.post('/api/v1/ai/chat', input);
    }
    async createEmbeddings(input) {
        return this.client.post('/api/v1/ai/embeddings', input);
    }
}
//# sourceMappingURL=ai-client.js.map