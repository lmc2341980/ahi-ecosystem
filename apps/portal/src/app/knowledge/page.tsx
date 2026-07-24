'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Badge,
  EmptyState,
  Button,
  Input,
} from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type { KnowledgeBase } from '@ahi/shared';

export default function KnowledgePage() {
  const sdk = useRef(createSdk());
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  const loadKnowledgeBases = useCallback(async () => {
    try {
      const response = await sdk.current.knowledge.listKnowledgeBases({ page: 1, pageSize: 50 });
      setKnowledgeBases(response.data);
    } catch {
      // service may not be running
    }
  }, []);

  useEffect(() => {
    loadKnowledgeBases();
  }, [loadKnowledgeBases]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await sdk.current.knowledge.createKnowledgeBase({
        organizationId: '00000000-0000-0000-0000-000000000000',
        name: newName,
        description: newDesc || undefined,
      });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
      loadKnowledgeBases();
    } catch {
      // ignore
    } finally {
      setCreating(false);
    }
  };

  return (
    <Container size="lg">
      <PageHeader
        title="Knowledge"
        description="Knowledge bases with semantic vector search powered by pgvector."
        action={
          <Button onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'New Knowledge Base'}
          </Button>
        }
      />

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-3">
            <Input
              label="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="My Knowledge Base"
            />
            <Input
              label="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Optional description"
            />
            <Button onClick={handleCreate} loading={creating} disabled={!newName.trim()}>
              Create
            </Button>
          </CardContent>
        </Card>
      )}

      {knowledgeBases.length === 0 ? (
        <EmptyState
          title="No knowledge bases"
          description="Create a knowledge base to start indexing documents with vector embeddings."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {knowledgeBases.map((kb) => (
            <Link key={kb.id} href={`/knowledge/${kb.id}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="pt-6">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-900">{kb.name}</h3>
                    <Badge
                      variant={
                        kb.status === 'active'
                          ? 'success'
                          : kb.status === 'indexing'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {kb.status}
                    </Badge>
                  </div>
                  {kb.description && (
                    <p className="mb-3 text-sm text-neutral-600">{kb.description}</p>
                  )}
                  <p className="text-sm text-neutral-500">
                    {kb.documentCount} document{kb.documentCount !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
