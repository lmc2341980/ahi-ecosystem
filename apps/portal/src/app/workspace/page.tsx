'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Select,
  Spinner,
  Badge,
  EmptyState,
} from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type { AhiWorkspace } from '@ahi/shared';

interface WSMessage {
  id: string;
  role: string;
  content: string;
  entity_type: string;
  evaluation_status: string;
  created_at: string;
}

export default function WorkspacePage() {
  const sdk = useRef(createSdk());
  const [workspaces, setWorkspaces] = useState<AhiWorkspace[]>([]);
  const [currentWsId, setCurrentWsId] = useState<string | null>(null);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [strategy, setStrategy] = useState('single');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadWorkspaces = useCallback(async () => {
    try {
      const resp = await sdk.current.ahi.listWorkspaces(1, 50);
      setWorkspaces(resp.data);
    } catch {
      // service may not be running
    }
  }, []);

  const loadMessages = useCallback(async (wsId: string) => {
    try {
      const msgs = await sdk.current.ahi.listWorkspaceMessages(wsId);
      setMessages(msgs as unknown as WSMessage[]);
    } catch {
      // service may not be running
    }
  }, []);

  useEffect(() => {
    loadWorkspaces();
  }, [loadWorkspaces]);

  useEffect(() => {
    if (currentWsId) loadMessages(currentWsId);
  }, [currentWsId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createWorkspace = async () => {
    if (!newWsName.trim()) return;
    try {
      const ws = await sdk.current.ahi.createWorkspace({
        name: newWsName,
        ownerType: 'person',
        ownerId: '00000000-0000-0000-0000-000000000000',
      });
      setNewWsName('');
      setShowCreate(false);
      setCurrentWsId(ws.id);
      loadWorkspaces();
    } catch {
      setError('Failed to create workspace');
    }
  };

  const sendOrchestrate = async () => {
    if (!input.trim() || !currentWsId) return;
    setLoading(true);
    setError(null);

    const optimisticMsg: WSMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: input,
      entity_type: 'human',
      evaluation_status: 'pending',
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimisticMsg]);
    setInput('');

    try {
      const result = await sdk.current.ahi.orchestrate({
        workspaceId: currentWsId,
        message: input,
        strategy: strategy as 'single' | 'multi_aggregate' | 'fallback',
      });

      const aiMsg: WSMessage = {
        id: result.ai_message_id,
        role: 'assistant',
        content: result.response,
        entity_type: 'ai',
        evaluation_status: result.evaluation.decision,
        created_at: new Date().toISOString(),
      };
      setMessages((m) => [...m.filter((msg) => msg.id !== optimisticMsg.id), aiMsg]);
    } catch {
      setError('AHI-Or failed. Make sure the AI service is running and AHI-Old models are registered.');
      setMessages((m) => m.filter((msg) => msg.id !== optimisticMsg.id));
      setInput(input);
    } finally {
      setLoading(false);
    }
  };

  const evalBadge = (status: string) => {
    if (status === 'approved') return <Badge variant="success">AHI-S</Badge>;
    if (status === 'rejected') return <Badge variant="error">Rejected</Badge>;
    return <Badge variant="warning">Pending</Badge>;
  };

  return (
    <Container size="xl">
      <PageHeader
        title="AHI-WS Workspace"
        description="Shared workspace where AHI-Or routes to free-tier AI models. Messages are evaluated by AHI-SuBiet."
        action={
          <Button variant="outline" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'New Workspace'}
          </Button>
        }
      />

      {error && (
        <div className="mb-4 rounded-md border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-800">
          {error}
        </div>
      )}

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-6 flex gap-3">
            <Input
              value={newWsName}
              onChange={(e) => setNewWsName(e.target.value)}
              placeholder="Workspace name"
              className="flex-1"
            />
            <Button onClick={createWorkspace} disabled={!newWsName.trim()}>
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-neutral-700">Workspaces</h2>
          {workspaces.length === 0 ? (
            <p className="text-sm text-neutral-400">No workspaces yet</p>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`rounded-md px-3 py-2 text-sm cursor-pointer transition-colors ${
                    currentWsId === ws.id
                      ? 'bg-primary-50 text-primary-900'
                      : 'hover:bg-neutral-100 text-neutral-700'
                  }`}
                  onClick={() => setCurrentWsId(ws.id)}
                >
                  <span className="font-medium">{ws.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col" style={{ height: 'calc(100vh - 280px)' }}>
          {currentWsId ? (
            <>
              <div className="mb-4 flex gap-3">
                <div className="w-48">
                  <Select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                  >
                    <option value="single">Single model</option>
                    <option value="multi_aggregate">Multi-aggregate</option>
                    <option value="fallback">Fallback</option>
                  </Select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto rounded-lg border border-neutral-200 bg-white p-4 space-y-4">
                {messages.length === 0 ? (
                  <EmptyState
                    title="No messages yet"
                    description="AHI-Or will route your message to free-tier AI models."
                  />
                ) : (
                  messages.map((msg) => (
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
                        {msg.role !== 'user' && (
                          <div className="mb-1 flex items-center gap-2">
                            <span className="text-xs font-semibold text-neutral-500">AHI-Or</span>
                            {evalBadge(msg.evaluation_status)}
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-neutral-100 rounded-lg px-4 py-2">
                      <Spinner className="h-5 w-5 text-neutral-400" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="mt-4 flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendOrchestrate();
                    }
                  }}
                  placeholder="Ask AHI-Or..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendOrchestrate}
                  loading={loading}
                  disabled={!input.trim()}
                >
                  Send
                </Button>
              </div>
            </>
          ) : (
            <EmptyState
              title="Select or create a workspace"
              description="AHI-WS is the shared environment where humans and AIs collaborate."
            />
          )}
        </div>
      </div>
    </Container>
  );
}
