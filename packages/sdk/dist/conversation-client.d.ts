import type { ChatWithHistoryInput, ChatWithHistoryResponse, Conversation, ConversationMessage, CreateConversationInput, PaginatedResponse, SendMessageInput } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class ConversationClient {
    private readonly client;
    constructor(client: HttpClient);
    listConversations(page?: number, pageSize?: number): Promise<PaginatedResponse<Conversation>>;
    getConversation(id: string): Promise<Conversation>;
    createConversation(input: CreateConversationInput): Promise<Conversation>;
    deleteConversation(id: string): Promise<void>;
    listMessages(conversationId: string): Promise<ConversationMessage[]>;
    addMessage(input: SendMessageInput): Promise<ConversationMessage>;
    chatWithHistory(input: ChatWithHistoryInput): Promise<ChatWithHistoryResponse>;
}
//# sourceMappingURL=conversation-client.d.ts.map