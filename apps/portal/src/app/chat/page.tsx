'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Container,
  PageHeader,
  Button,
  Input,
  Select,
  Spinner,
  Badge,
} from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type {
  AIModel,
  Conversation,
  ConversationMessage,
  ChatWithHistoryResponse,
} from '@ahi/shared';

interface ChatState {
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: ConversationMessage[];
  models: AIModel[];
  selectedProvider: string;
  selectedModel: string;
  input: string;
  loading: boolean;
  error: string | null;
}

export default function ChatPage() {
  const sdk = useRef(createSdk());
  const [state, setState] = useState<ChatState>({
    conversations: [],
    currentConversationId: null,
    messages: [],
    models: [],
    selectedProvider: 'openai',
    selectedModel: '',
    input: '',
    loading: false,
    error: null,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const resp = await sdk.current.conversations.listConversations(1, 50);
      setState((s) => ({ ...s, conversations: resp.data }));
    } catch {
      // service may not be running
    }
  }, []);

  const loadModels = useCallback(async () => {
    try {
      const models = await sdk.current.ai.listModels();
      const firstModel = models[0];
      setState((s) => ({
        ...s,
        models,
        selectedProvider: firstModel?.provider ?? 'openai',
        selectedModel: firstModel?.id ?? '',
      }));
    } catch {
      // service may not be running
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadModels();
  }, [loadConversations, loadModels]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  const selectConversation = async (id: string) => {
    try {
      const [conv, msgs] = await Promise.all([
        sdk.current.conversations.getConversation(id),
        sdk.current.conversations.listMessages(id),
      ]);
      setState((s) => ({
        ...s,
        currentConversationId: id,
        messages: msgs,
        selectedProvider: conv.provider,
        selectedModel: conv.model,
      }));
    } catch (err) {
      setState((s) => ({ ...s, error: 'Failed to load conversation' }));
    }
  };

  const sendMessage = async () => {
    const { input, selectedProvider, selectedModel, currentConversationId } = state;
    if (!input.trim() || !selectedModel) return;

    setState((s) => ({ ...s, loading: true, error: null, input: '' }));

    const optimisticUserMsg: ConversationMessage = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversationId ?? '',
      role: 'user',
      content: input,
      tokenCount: 0,
      createdAt: new Date().toISOString(),
    };
    setState((s) => ({
      ...s,
      messages: [...s.messages, optimisticUserMsg],
    }));

    try {
      const response: ChatWithHistoryResponse =
        await sdk.current.conversations.chatWithHistory({
          provider: selectedProvider as 'openai' | 'gemini' | 'ollama',
          model: selectedModel,
          message: input,
          conversationId: currentConversationId ?? undefined,
        });

      setState((s) => ({
        ...s,
        currentConversationId: response.conversationId,
        messages: [...s.messages.filter((m) => m.id !== optimisticUserMsg.id), response.userMessage, response.assistantMessage],
        loading: false,
      }));
      loadConversations();
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: 'Failed to get AI response. Make sure the AI service is running and API keys are configured.',
        messages: s.messages.filter((m) => m.id !== optimisticUserMsg.id),
        input,
      }));
    }
  };

  const newConversation = () => {
    setState((s) => ({
      ...s,
      currentConversationId: null,
      messages: [],
      error: null,
    }));
  };

  const deleteConversation = async (id: string) => {
    try {
      await sdk.current.conversations.deleteConversation(id);
      if (state.currentConversationId === id) {
        newConversation();
      }
      loadConversations();
    } catch {
      setState((s) => ({ ...s, error: 'Failed to delete conversation' }));
    }
  };

  const availableModels = state.models.filter(
    (m) => m.provider === state.selectedProvider,
  );

  return (
    <Container size="xl">
      <PageHeader
        title="AI Chat"
        description="Chat with multiple AI providers. Conversations are saved automatically."
        action={
          <Button variant="outline" onClick={newConversation}>
            New Chat
          </Button>
        }
      />

      {state.error && (
        <div className="mb-4 rounded-md border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-800">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        {/* Conversation sidebar */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">Conversations</h2>
          {state.conversations.length === 0 ? (
            <p className="text-sm text-neutral-400">No conversations yet</p>
          ) : (
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {state.conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                    state.currentConversationId === conv.id
                      ? 'bg-primary-50 text-primary-900'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                  onClick={() => selectConversation(conv.id)}
                >
                  <div className="flex-1 truncate">
                    <span className="font-medium">{conv.title}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant="neutral">{conv.provider}</Badge>
                      <span className="text-xs text-neutral-400">{conv.model}</span>
                    </div>
                  </div>
                  <button
                    className="ml-2 text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-error-500 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}
                    aria-label="Delete conversation"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
          {/* Provider/Model selector */}
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="w-40">
              <Select
                value={state.selectedProvider}
                onChange={(e) => {
                  const provider = e.target.value;
                  const firstModel = state.models.find((m) => m.provider === provider);
                  setState((s) => ({
                    ...s,
                    selectedProvider: provider,
                    selectedModel: firstModel?.id ?? '',
                  }));
                }}
              >
                <option value="openai">OpenAI</option>
                <option value="gemini">Gemini</option>
                <option value="ollama">Ollama</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select
                value={state.selectedModel}
                onChange={(e) =>
                  setState((s) => ({ ...s, selectedModel: e.target.value }))
                }
              >
                {availableModels.length === 0 ? (
                  <option value="">No models available</option>
                ) : (
                  availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))
                )}
              </Select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
            {state.messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <p className="text-neutral-400 text-sm">
                    Start a conversation by typing a message below.
                  </p>
                  <p className="text-neutral-300 text-xs mt-2">
                    Messages are saved to the database and can be continued later.
                  </p>
                </div>
              </div>
            ) : (
              state.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-900'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            {state.loading && (
              <div className="flex justify-start">
                <div className="bg-neutral-100 rounded-lg px-4 py-2">
                  <Spinner className="h-5 w-5 text-neutral-400" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="mt-4 flex gap-2">
            <Input
              value={state.input}
              onChange={(e) => setState((s) => ({ ...s, input: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type a message..."
              disabled={state.loading}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              loading={state.loading}
              disabled={!state.input.trim() || !state.selectedModel}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Container>
  );
}
