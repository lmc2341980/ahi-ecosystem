import type { ISODateString } from './common';

export type AIProvider = 'openai' | 'gemini' | 'ollama';

export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  provider: AIProvider;
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatCompletionResponse {
  id: string;
  provider: AIProvider;
  model: string;
  message: ChatMessage;
  usage: TokenUsage;
  createdAt: ISODateString;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface EmbeddingRequest {
  provider: AIProvider;
  model: string;
  input: string | string[];
}

export interface EmbeddingResponse {
  provider: AIProvider;
  model: string;
  embeddings: number[][];
  usage: TokenUsage;
}

export interface AIModel {
  id: string;
  provider: AIProvider;
  name: string;
  contextWindow: number;
  supportsStreaming: boolean;
  supportsToolCalls: boolean;
}
