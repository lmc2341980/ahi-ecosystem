import type {
  AIModel,
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class AiClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async listModels(): Promise<AIModel[]> {
    return this.client.get<AIModel[]>('/api/v1/ai/models');
  }

  async chatCompletion(input: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.client.post<ChatCompletionResponse>('/api/v1/ai/chat', input);
  }

  async createEmbeddings(input: EmbeddingRequest): Promise<EmbeddingResponse> {
    return this.client.post<EmbeddingResponse>('/api/v1/ai/embeddings', input);
  }
}
