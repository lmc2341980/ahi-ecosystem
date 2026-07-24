export class ConversationClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async listConversations(page = 1, pageSize = 20) {
        return this.client.get('/api/v1/ai/conversations', { page, page_size: pageSize });
    }
    async getConversation(id) {
        return this.client.get(`/api/v1/ai/conversations/${id}`);
    }
    async createConversation(input) {
        return this.client.post('/api/v1/ai/conversations', input);
    }
    async deleteConversation(id) {
        await this.client.delete(`/api/v1/ai/conversations/${id}`);
    }
    async listMessages(conversationId) {
        return this.client.get(`/api/v1/ai/conversations/${conversationId}/messages`);
    }
    async addMessage(input) {
        return this.client.post(`/api/v1/ai/conversations/${input.conversationId}/messages`, input);
    }
    async chatWithHistory(input) {
        return this.client.post('/api/v1/ai/chat-with-history', input);
    }
}
//# sourceMappingURL=conversation-client.js.map