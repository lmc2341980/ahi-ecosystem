import type { AIModel, ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class AiClient {
    private readonly client;
    constructor(client: HttpClient);
    listModels(): Promise<AIModel[]>;
    chatCompletion(input: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    createEmbeddings(input: EmbeddingRequest): Promise<EmbeddingResponse>;
}
//# sourceMappingURL=ai-client.d.ts.map