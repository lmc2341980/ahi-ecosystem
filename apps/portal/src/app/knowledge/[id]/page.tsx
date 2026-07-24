'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Container,
  PageHeader,
  Card,
  CardContent,
  Button,
  Input,
  Textarea,
  Badge,
  Spinner,
} from '@ahi/ui';
import { createSdk } from '@ahi/sdk';
import type {
  KnowledgeDocument,
  KnowledgeSearchResult,
  IndexDocumentResponse,
} from '@ahi/shared';

export default function KnowledgeBaseDetailPage() {
  const params = useParams<{ id: string }>();
  const kbId = params.id;
  const sdk = useRef(createSdk());
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<IndexDocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    try {
      const resp = await sdk.current.knowledge.listDocuments(kbId, { page: 1, pageSize: 50 });
      setDocuments(resp.data);
    } catch {
      // service may not be running
    }
  }, [kbId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async () => {
    if (!docTitle.trim() || !docContent.trim()) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);
    try {
      const result = await sdk.current.knowledge.addDocument(kbId, {
        knowledgeBaseId: kbId,
        title: docTitle,
        content: docContent,
      });
      setUploadResult(result);
      setDocTitle('');
      setDocContent('');
      loadDocuments();
    } catch {
      setError('Failed to upload document. Make sure the Knowledge and AI services are running.');
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const results = await sdk.current.knowledge.search({
        knowledgeBaseId: kbId,
        query: searchQuery,
        topK: 5,
        minScore: 0.0,
      });
      setSearchResults(results);
    } catch {
      setError('Search failed. Make sure the Knowledge and AI services are running.');
    } finally {
      setSearching(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await sdk.current.knowledge.deleteDocument(kbId, docId);
      loadDocuments();
    } catch {
      setError('Failed to delete document.');
    }
  };

  return (
    <Container size="lg">
      <PageHeader
        title="Knowledge Base"
        description="Upload documents and search using semantic vector search."
      />

      {error && (
        <div className="mb-4 rounded-md border border-error-300 bg-error-50 px-4 py-3 text-sm text-error-800">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Add Document</h2>
            <div className="space-y-3">
              <Input
                label="Title"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document title"
              />
              <Textarea
                label="Content"
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste document content here..."
                rows={8}
              />
              <Button
                onClick={handleUpload}
                loading={uploading}
                disabled={!docTitle.trim() || !docContent.trim()}
              >
                Upload & Index
              </Button>
              {uploadResult && (
                <div className="rounded-md border border-success-300 bg-success-50 px-4 py-2 text-sm text-success-800">
                  Indexed {uploadResult.chunkCount} chunks. Status: {uploadResult.status}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">Semantic Search</h2>
            <div className="flex gap-2 mb-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
                placeholder="Search by meaning..."
                className="flex-1"
              />
              <Button onClick={handleSearch} loading={searching} disabled={!searchQuery.trim()}>
                Search
              </Button>
            </div>
            {searching ? (
              <div className="flex justify-center py-8">
                <Spinner className="h-6 w-6" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div key={result.chunkId} className="rounded-md border border-neutral-200 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <Badge variant="primary">
                        Score: {(result.score * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-700 line-clamp-4">{result.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 py-4 text-center">
                Search results will appear here
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">Documents</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-neutral-400">No documents indexed yet</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="pt-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-neutral-900">{doc.title}</h3>
                    <Badge
                      variant={
                        doc.status === 'indexed'
                          ? 'success'
                          : doc.status === 'pending'
                            ? 'warning'
                            : 'error'
                      }
                    >
                      {doc.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>{doc.chunkCount} chunks</span>
                    <button
                      className="text-neutral-300 hover:text-error-500"
                      onClick={() => handleDeleteDocument(doc.id)}
                    >
                      Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
