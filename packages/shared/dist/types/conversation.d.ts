import type { ISODateString, UUID } from './common';
import type { AIProvider, ChatRole } from './ai';
export interface Conversation {
    id: UUID;
    title: string;
    provider: AIProvider;
    model: string;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}
export interface ConversationMessage {
    id: UUID;
    conversationId: UUID;
    role: ChatRole;
    content: string;
    tokenCount: number;
    createdAt: ISODateString;
}
export interface CreateConversationInput {
    title?: string;
    provider: AIProvider;
    model: string;
}
export interface SendMessageInput {
    conversationId: UUID;
    role: ChatRole;
    content: string;
    tokenCount?: number;
}
export interface ChatWithHistoryInput {
    provider: AIProvider;
    model: string;
    message: string;
    conversationId?: UUID;
    temperature?: number;
    maxTokens?: number;
}
export interface ChatWithHistoryResponse {
    conversationId: UUID;
    userMessage: ConversationMessage;
    assistantMessage: ConversationMessage;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
//# sourceMappingURL=conversation.d.ts.map