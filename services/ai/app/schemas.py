from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AIProvider(str, Enum):
    openai = "openai"
    gemini = "gemini"
    ollama = "ollama"


class ChatRole(str, Enum):
    system = "system"
    user = "user"
    assistant = "assistant"


class ChatMessage(BaseModel):
    role: ChatRole
    content: str


class ChatCompletionRequest(BaseModel):
    provider: AIProvider
    model: str
    messages: list[ChatMessage]
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1)
    stream: bool = False


class TokenUsage(BaseModel):
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int


class ChatCompletionResponse(BaseModel):
    id: str
    provider: AIProvider
    model: str
    message: ChatMessage
    usage: TokenUsage
    created_at: datetime


class EmbeddingRequest(BaseModel):
    provider: AIProvider
    model: str
    input: str | list[str]


class EmbeddingResponse(BaseModel):
    provider: AIProvider
    model: str
    embeddings: list[list[float]]
    usage: TokenUsage


class AIModel(BaseModel):
    id: str
    provider: AIProvider
    name: str
    context_window: int
    supports_streaming: bool
    supports_tool_calls: bool


class PaginatedResponse(BaseModel):
    data: list[Any]
    total: int
    page: int
    page_size: int


# --- Conversation persistence schemas ---


class Conversation(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    provider: AIProvider
    model: str
    created_at: datetime
    updated_at: datetime


class ConversationMessage(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    conversation_id: UUID
    role: ChatRole
    content: str
    token_count: int
    created_at: datetime


class CreateConversationInput(BaseModel):
    title: str = Field(default="New Conversation")
    provider: AIProvider
    model: str


class SendMessageInput(BaseModel):
    conversation_id: UUID
    role: ChatRole
    content: str
    token_count: int = Field(default=0)


class ChatWithHistoryInput(BaseModel):
    provider: AIProvider
    model: str
    message: str
    conversation_id: UUID | None = None
    title: str | None = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int | None = Field(default=None, ge=1)


class ChatWithHistoryResponse(BaseModel):
    conversation_id: UUID
    user_message: ConversationMessage
    assistant_message: ConversationMessage
    usage: TokenUsage
