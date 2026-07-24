/*
# AI Knowledge Foundation: pgvector, Conversations, and Knowledge Chunks

## Purpose
This migration creates the database foundation for the AI multi-platform connector MVP:
1. Enables the pgvector extension for vector embeddings (DBV - Vector Database)
2. Creates conversations and messages tables for unified chat history (DBRS - Relational Database)
3. Creates knowledge_chunks table with vector embeddings for semantic search
4. Creates knowledge_bases and knowledge_documents tables (mirrors existing SQLAlchemy models)

## New Tables

### conversations
- Stores unified conversation sessions across all AI providers
- `id` (uuid, PK)
- `title` (text) - conversation title
- `provider` (text) - which AI provider was used (openai/gemini/ollama)
- `model` (text) - which model was used
- `created_at`, `updated_at` (timestamps)

### messages
- Stores individual messages within a conversation
- `id` (uuid, PK)
- `conversation_id` (uuid, FK to conversations, CASCADE)
- `role` (text) - system/user/assistant
- `content` (text) - message content
- `token_count` (int) - token usage for this message
- `created_at` (timestamp)

### knowledge_bases
- Stores knowledge base metadata
- `id` (uuid, PK)
- `organization_id` (uuid) - owning organization
- `name` (text), `description` (text)
- `status` (text) - active/indexing/error
- `embedding_model` (text) - which embedding model to use
- `embedding_provider` (text) - which provider for embeddings
- `created_at`, `updated_at`

### knowledge_documents
- Stores document metadata within a knowledge base
- `id` (uuid, PK)
- `knowledge_base_id` (uuid, FK to knowledge_bases, CASCADE)
- `title`, `source`, `mime_type`, `size_bytes`
- `status` (text) - pending/indexed/failed
- `chunk_count` (int)
- `created_at`, `updated_at`

### knowledge_chunks
- Stores text chunks with vector embeddings (the DBV / vector search layer)
- `id` (uuid, PK)
- `document_id` (uuid, FK to knowledge_documents, CASCADE)
- `knowledge_base_id` (uuid, FK to knowledge_bases, CASCADE)
- `chunk_index` (int) - position within document
- `content` (text) - the actual text chunk
- `embedding` (vector(1536)) - pgvector embedding for semantic search
- `metadata` (jsonb) - additional metadata
- `created_at`

## Security
- RLS enabled on all tables
- All tables use `TO anon, authenticated` with `USING (true)` since this is a single-tenant MVP with no sign-in screen
- Data is intentionally shared/public within the MVP

## Notes
1. The vector dimension is 1536 (OpenAI text-embedding-ada-002 / text-embedding-3-small standard)
2. HNSW index on knowledge_chunks.embedding for fast approximate nearest neighbor search
3. All timestamps are timezone-aware
4. Tables are idempotent (IF NOT EXISTS)
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- conversations (DBRS - unified chat history)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL DEFAULT 'New Conversation',
    provider text NOT NULL DEFAULT 'openai',
    model text NOT NULL DEFAULT '',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
    TO anon, authenticated USING (true);

-- ============================================================
-- messages (DBRS - individual messages within conversations)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('system', 'user', 'assistant')),
    content text NOT NULL,
    token_count int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE
    TO anon, authenticated USING (true);

-- ============================================================
-- knowledge_bases (DBRS - knowledge base metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    name text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'indexing', 'error')),
    embedding_provider text NOT NULL DEFAULT 'openai',
    embedding_model text NOT NULL DEFAULT 'text-embedding-3-small',
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_knowledge_bases" ON knowledge_bases;
CREATE POLICY "anon_select_knowledge_bases" ON knowledge_bases FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_knowledge_bases" ON knowledge_bases;
CREATE POLICY "anon_insert_knowledge_bases" ON knowledge_bases FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_knowledge_bases" ON knowledge_bases;
CREATE POLICY "anon_update_knowledge_bases" ON knowledge_bases FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_knowledge_bases" ON knowledge_bases;
CREATE POLICY "anon_delete_knowledge_bases" ON knowledge_bases FOR DELETE
    TO anon, authenticated USING (true);

-- ============================================================
-- knowledge_documents (DBRS - document metadata)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    title text NOT NULL,
    source text NOT NULL,
    mime_type text NOT NULL DEFAULT 'text/plain',
    size_bytes int NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'indexed', 'failed')),
    chunk_count int NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_kb_id ON knowledge_documents(knowledge_base_id);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_knowledge_documents" ON knowledge_documents;
CREATE POLICY "anon_select_knowledge_documents" ON knowledge_documents FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_knowledge_documents" ON knowledge_documents;
CREATE POLICY "anon_insert_knowledge_documents" ON knowledge_documents FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_knowledge_documents" ON knowledge_documents;
CREATE POLICY "anon_update_knowledge_documents" ON knowledge_documents FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_knowledge_documents" ON knowledge_documents;
CREATE POLICY "anon_delete_knowledge_documents" ON knowledge_documents FOR DELETE
    TO anon, authenticated USING (true);

-- ============================================================
-- knowledge_chunks (DBV - vector embeddings for semantic search)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
    chunk_index int NOT NULL DEFAULT 0,
    content text NOT NULL,
    embedding vector(1536),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_doc_id ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_kb_id ON knowledge_chunks(knowledge_base_id);

-- HNSW index for fast approximate nearest neighbor search on embeddings
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
    ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "anon_select_knowledge_chunks" ON knowledge_chunks FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "anon_insert_knowledge_chunks" ON knowledge_chunks FOR INSERT
    TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "anon_update_knowledge_chunks" ON knowledge_chunks FOR UPDATE
    TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_knowledge_chunks" ON knowledge_chunks;
CREATE POLICY "anon_delete_knowledge_chunks" ON knowledge_chunks FOR DELETE
    TO anon, authenticated USING (true);

-- ============================================================
-- match_knowledge function (DBV - semantic search via pgvector)
-- ============================================================
CREATE OR REPLACE FUNCTION match_knowledge(
    query_embedding vector(1536),
    kb_id uuid,
    match_count int DEFAULT 5,
    min_score float DEFAULT 0.0
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    chunk_index int,
    content text,
    score float,
    metadata jsonb
)
LANGUAGE sql
STABLE
AS $$
    SELECT
        c.id,
        c.document_id,
        c.chunk_index,
        c.content,
        1 - (c.embedding <=> query_embedding) AS score,
        c.metadata
    FROM knowledge_chunks c
    WHERE c.knowledge_base_id = kb_id
      AND c.embedding IS NOT NULL
      AND 1 - (c.embedding <=> query_embedding) >= min_score
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
$$;
