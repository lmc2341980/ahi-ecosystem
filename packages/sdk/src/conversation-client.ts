import type {
  ChatWithHistoryInput,
  ChatWithHistoryResponse,
  Conversation,
  ConversationMessage,
  CreateConversationInput,
  PaginatedResponse,
  SendMessageInput,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class ConversationClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async listConversations(
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResponse<Conversation>> {
    return this.client.get<PaginatedResponse<Conversation>>(
      '/api/v1/ai/conversations',
      { page, page_size: pageSize },
    );
  }

  async getConversation(id: string): Promise<Conversation> {
    return this.client.get<Conversation>(`/api/v1/ai/conversations/${id}`);
  }

  async createConversation(
    input: CreateConversationInput,
  ): Promise<Conversation> {
    return this.client.post<Conversation>(
      '/api/v1/ai/conversations',
      input,
    );
  }

  async deleteConversation(id: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/ai/conversations/${id}`);
  }

  async listMessages(conversationId: string): Promise<ConversationMessage[]> {
    return this.client.get<ConversationMessage[]>(
      `/api/v1/ai/conversations/${conversationId}/messages`,
    );
  }

  async addMessage(input: SendMessageInput): Promise<ConversationMessage> {
    return this.client.post<ConversationMessage>(
      `/api/v1/ai/conversations/${input.conversationId}/messages`,
      input,
    );
  }

  async chatWithHistory(
    input: ChatWithHistoryInput,
  ): Promise<ChatWithHistoryResponse> {
    return this.client.post<ChatWithHistoryResponse>(
      '/api/v1/ai/chat-with-history',
      input,
    );
  }
}
