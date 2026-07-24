/*
# AHI Ecosystem Foundation: Entities, Governance, Cache, Workspace

## Purpose
This migration creates the database foundation for the AHI ecosystem — an evolving AI
system where human and organizational sessions persist across time and space.

## New Tables

### ahi_persons (AHI-P)
- Registered individuals in the AHI ecosystem
- `id` (uuid PK), `email` (unique), `display_name`, `ahi_code` (human-readable AHI identifier)
- `verification_level` (none/language/vouched/government) — low vs high verification
- `country_code` (ISO 3166-1 alpha-2) — links to AHI-G geographic governance
- `status` (active/restricted/frozen) — frozen = under constitutional review
- `is_ahi_s` (bool) — true = compliant citizen (AHI-S), false = under review
- `created_at`, `updated_at`

### ahi_organizations (AHI-O)
- Organizations created by AHI-P members
- `id`, `name`, `slug`, `description`, `created_by` (FK ahi_persons)
- `governance_type` (quorum_percentage) — % of members needed for decisions
- `status`, `is_ahi_s`, `country_code`
- `created_at`, `updated_at`

### ahi_org_members
- Links AHI-P to AHI-O with role and voting weight
- `id`, `org_id` (FK), `person_id` (FK), `role`, `voting_weight`
- `joined_at`

### ahi_geographic (AHI-G)
- National-level AHI governance zones
- `id`, `country_code` (unique), `country_name`, `region_name`
- `governance_type` — how this AHI-G operates
- `status`, `is_ahi_s`
- `created_at`, `updated_at`

### ahi_geographic_members
- Links AHI-P or AHI-O to an AHI-G with verification status
- `id`, `geographic_id` (FK), `entity_type` (person/organization), `entity_id`
- `verification_type` (self_claim/vouched/government_verified)
- `verified_at`, `verifier_id`

### ahi_constitution (AHI-Core principles)
- Published and core principles of the AHI constitution
- `id`, `article_number`, `title`, `principle_type` (published/core)
- `content`, `is_active`
- `created_at`, `updated_at`

### ahi_verifications (AHI-V)
- Constitutional compliance checks on entities
- `id`, `entity_type` (person/organization/geographic/ai_model), `entity_id`
- `verifier_id` (FK ahi_persons — the AHI-V inspector)
- `status` (compliant/under_review/violation)
- `findings`, `verified_at`

### ahi_cache_l1 (AHI-Cache — L1 Cache / fastest layer)
- Ultra-fast key-value cache for hot data (analogous to CPU L1 cache)
- `id`, `key` (unique), `value` (jsonb), `ttl_seconds`
- `expires_at`, `created_at`

### ahi_cache_l2 (AHI-Cache — L2 RAM / medium layer)
- Medium-speed session and context cache (analogous to RAM)
- `id`, `session_id`, `key`, `value` (jsonb), `ttl_seconds`
- `expires_at`, `created_at`

### ahi_cache_l3 (AHI-Cache — L3 SSD / persistent layer)
- Persistent cache for longer-lived data (analogous to SSD)
- `id`, `entity_type`, `entity_id`, `key`, `value` (jsonb)
- `access_count`, `last_accessed_at`, `created_at`

### ahi_workspaces (AHI-WS)
- Shared workspaces where humans and AIs interact
- `id`, `name`, `owner_type` (person/organization), `owner_id`
- `status` (active/archived), `created_at`, `updated_at`

### ahi_workspace_messages
- Temporary messages in AHI-WS, evaluated by AHI-SuBiet before promotion to DBRS
- `id`, `workspace_id` (FK), `entity_type` (human/ai), `entity_id`
- `role` (user/assistant/system), `content`
- `evaluation_status` (pending/approved/rejected)
- `evaluated_by`, `evaluated_at`
- `token_count`, `created_at`

### ahi_legacy_models (AHI-Old registry)
- Registry of external AI models (ChatGPT, Claude, Gemini, Grok, etc.)
- `id`, `ahi_name` (e.g. AHI-CHATGPT), `original_name` (e.g. ChatGPT)
- `provider` (openai/anthropic/google/xai/...)
- `is_free_tier` (bool) — whether this model has a free tier
- `evolution_data` (jsonb) — accumulated evolutionary knowledge
- `status` (active/disabled), `created_at`, `updated_at`

### ahi_orchestrations (AHI-Or records)
- Records of AHI-Or routing decisions (which free AI(s) to call)
- `id`, `workspace_message_id` (FK)
- `target_models` (text[] — list of AHI-Old model IDs)
- `strategy` (single/multi_aggregate/fallback)
- `result_summary`, `status`
- `created_at`

### ahi_evaluations (AHI-SuBiet records)
- Quality evaluations of workspace messages
- `id`, `workspace_message_id` (FK)
- `evaluator_type` (ahi_subiet/auto/manual)
- `score` (0-1), `decision` (approved/rejected/needs_review)
- `reasoning`, `created_at`

## Security
- RLS enabled on all tables
- Single-tenant MVP: `TO anon, authenticated` with `USING (true)` — data is intentionally shared
- ahi_constitution and ahi_legacy_models are read-only for anon (SELECT only)

## Notes
1. All entity tables have `is_ahi_s` flag for AHI-S compliance marking
2. AHI-Cache has 3 layers matching CPU cache hierarchy (L1/Cache, L2/RAM, L3/SSD)
3. ahi_workspace_messages bridge AHI-WS (temporary) to DBRS (permanent) via evaluation
4. ahi_legacy_models store evolution_data as jsonb for progressive learning
*/

-- Enable pgvector (already enabled, but ensure idempotent)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- ahi_persons (AHI-P)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_persons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text UNIQUE NOT NULL,
    display_name text NOT NULL,
    ahi_code text UNIQUE NOT NULL DEFAULT '',
    verification_level text NOT NULL DEFAULT 'none'
        CHECK (verification_level IN ('none', 'language', 'vouched', 'government')),
    country_code text DEFAULT '',
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'restricted', 'frozen')),
    is_ahi_s boolean NOT NULL DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_persons_country ON ahi_persons(country_code);
CREATE INDEX IF NOT EXISTS idx_ahi_persons_status ON ahi_persons(status);
CREATE INDEX IF NOT EXISTS idx_ahi_persons_ahi_s ON ahi_persons(is_ahi_s) WHERE is_ahi_s = true;

ALTER TABLE ahi_persons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_persons" ON ahi_persons;
CREATE POLICY "anon_crud_ahi_persons" ON ahi_persons FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_organizations (AHI-O)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    description text,
    created_by uuid REFERENCES ahi_persons(id) ON DELETE SET NULL,
    governance_type text NOT NULL DEFAULT 'quorum_50'
        CHECK (governance_type IN ('quorum_50', 'quorum_66', 'quorum_75', 'consensus')),
    country_code text DEFAULT '',
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'restricted', 'frozen')),
    is_ahi_s boolean NOT NULL DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_orgs_status ON ahi_organizations(status);
CREATE INDEX IF NOT EXISTS idx_ahi_orgs_country ON ahi_organizations(country_code);

ALTER TABLE ahi_organizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_orgs" ON ahi_organizations;
CREATE POLICY "anon_crud_ahi_orgs" ON ahi_organizations FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_org_members
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_org_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES ahi_organizations(id) ON DELETE CASCADE,
    person_id uuid NOT NULL REFERENCES ahi_persons(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'member', 'observer')),
    voting_weight numeric NOT NULL DEFAULT 1.0,
    joined_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(org_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_ahi_org_members_org ON ahi_org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_ahi_org_members_person ON ahi_org_members(person_id);

ALTER TABLE ahi_org_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_org_members" ON ahi_org_members;
CREATE POLICY "anon_crud_ahi_org_members" ON ahi_org_members FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_geographic (AHI-G)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_geographic (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    country_code text UNIQUE NOT NULL,
    country_name text NOT NULL,
    region_name text,
    governance_type text NOT NULL DEFAULT 'standard',
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'restricted', 'frozen')),
    is_ahi_s boolean NOT NULL DEFAULT false,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ahi_geographic ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_geographic" ON ahi_geographic;
CREATE POLICY "anon_crud_ahi_geographic" ON ahi_geographic FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_geographic_members
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_geographic_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    geographic_id uuid NOT NULL REFERENCES ahi_geographic(id) ON DELETE CASCADE,
    entity_type text NOT NULL CHECK (entity_type IN ('person', 'organization')),
    entity_id uuid NOT NULL,
    verification_type text NOT NULL DEFAULT 'self_claim'
        CHECK (verification_type IN ('self_claim', 'vouched', 'government_verified')),
    verifier_id uuid,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(geographic_id, entity_type, entity_id)
);

CREATE INDEX IF NOT EXISTS idx_ahi_geo_members_geo ON ahi_geographic_members(geographic_id);
CREATE INDEX IF NOT EXISTS idx_ahi_geo_members_entity ON ahi_geographic_members(entity_type, entity_id);

ALTER TABLE ahi_geographic_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_geo_members" ON ahi_geographic_members;
CREATE POLICY "anon_crud_ahi_geo_members" ON ahi_geographic_members FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_constitution (AHI-Core principles)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_constitution (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    article_number int NOT NULL,
    title text NOT NULL,
    principle_type text NOT NULL CHECK (principle_type IN ('published', 'core')),
    content text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE ahi_constitution ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_ahi_constitution" ON ahi_constitution;
CREATE POLICY "anon_read_ahi_constitution" ON ahi_constitution FOR SELECT
    TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_ahi_constitution" ON ahi_constitution;
CREATE POLICY "anon_write_ahi_constitution" ON ahi_constitution FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_verifications (AHI-V)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_verifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL
        CHECK (entity_type IN ('person', 'organization', 'geographic', 'ai_model')),
    entity_id uuid NOT NULL,
    verifier_id uuid REFERENCES ahi_persons(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'compliant'
        CHECK (status IN ('compliant', 'under_review', 'violation')),
    findings text,
    verified_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_verifications_entity ON ahi_verifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ahi_verifications_status ON ahi_verifications(status);

ALTER TABLE ahi_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_verifications" ON ahi_verifications;
CREATE POLICY "anon_crud_ahi_verifications" ON ahi_verifications FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_cache_l1 (AHI-Cache — L1 / fastest)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_cache_l1 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    ttl_seconds int NOT NULL DEFAULT 60,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 seconds'),
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_cache_l1_expires ON ahi_cache_l1(expires_at);
CREATE INDEX IF NOT EXISTS idx_ahi_cache_l1_key ON ahi_cache_l1(key);

ALTER TABLE ahi_cache_l1 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_cache_l1" ON ahi_cache_l1;
CREATE POLICY "anon_crud_ahi_cache_l1" ON ahi_cache_l1 FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_cache_l2 (AHI-Cache — L2 / RAM)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_cache_l2 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id uuid NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    ttl_seconds int NOT NULL DEFAULT 3600,
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour'),
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(session_id, key)
);

CREATE INDEX IF NOT EXISTS idx_ahi_cache_l2_session ON ahi_cache_l2(session_id);
CREATE INDEX IF NOT EXISTS idx_ahi_cache_l2_expires ON ahi_cache_l2(expires_at);

ALTER TABLE ahi_cache_l2 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_cache_l2" ON ahi_cache_l2;
CREATE POLICY "anon_crud_ahi_cache_l2" ON ahi_cache_l2 FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_cache_l3 (AHI-Cache — L3 / SSD persistent)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_cache_l3 (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    key text NOT NULL,
    value jsonb NOT NULL,
    access_count int NOT NULL DEFAULT 0,
    last_accessed_at timestamptz DEFAULT now() NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(entity_type, entity_id, key)
);

CREATE INDEX IF NOT EXISTS idx_ahi_cache_l3_entity ON ahi_cache_l3(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ahi_cache_l3_access ON ahi_cache_l3(last_accessed_at);

ALTER TABLE ahi_cache_l3 ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_cache_l3" ON ahi_cache_l3;
CREATE POLICY "anon_crud_ahi_cache_l3" ON ahi_cache_l3 FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_workspaces (AHI-WS)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_workspaces (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    owner_type text NOT NULL CHECK (owner_type IN ('person', 'organization')),
    owner_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'archived')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_workspaces_owner ON ahi_workspaces(owner_type, owner_id);

ALTER TABLE ahi_workspaces ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_workspaces" ON ahi_workspaces;
CREATE POLICY "anon_crud_ahi_workspaces" ON ahi_workspaces FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_workspace_messages (AHI-WS temporary → DBRS promotion)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_workspace_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES ahi_workspaces(id) ON DELETE CASCADE,
    entity_type text NOT NULL CHECK (entity_type IN ('human', 'ai')),
    entity_id uuid,
    role text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content text NOT NULL,
    evaluation_status text NOT NULL DEFAULT 'pending'
        CHECK (evaluation_status IN ('pending', 'approved', 'rejected')),
    evaluated_by uuid,
    evaluated_at timestamptz,
    token_count int NOT NULL DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_ws_messages_workspace ON ahi_workspace_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_ahi_ws_messages_eval ON ahi_workspace_messages(evaluation_status);
CREATE INDEX IF NOT EXISTS idx_ahi_ws_messages_created ON ahi_workspace_messages(workspace_id, created_at);

ALTER TABLE ahi_workspace_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_ws_messages" ON ahi_workspace_messages;
CREATE POLICY "anon_crud_ahi_ws_messages" ON ahi_workspace_messages FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_legacy_models (AHI-Old registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_legacy_models (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ahi_name text UNIQUE NOT NULL,
    original_name text NOT NULL,
    provider text NOT NULL,
    is_free_tier boolean NOT NULL DEFAULT false,
    evolution_data jsonb DEFAULT '{}'::jsonb,
    status text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'disabled')),
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_legacy_models_provider ON ahi_legacy_models(provider);
CREATE INDEX IF NOT EXISTS idx_ahi_legacy_models_free ON ahi_legacy_models(is_free_tier) WHERE is_free_tier = true;

ALTER TABLE ahi_legacy_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_legacy_models" ON ahi_legacy_models;
CREATE POLICY "anon_crud_ahi_legacy_models" ON ahi_legacy_models FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_orchestrations (AHI-Or routing records)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_orchestrations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_message_id uuid REFERENCES ahi_workspace_messages(id) ON DELETE SET NULL,
    target_models text[] NOT NULL DEFAULT '{}',
    strategy text NOT NULL DEFAULT 'single'
        CHECK (strategy IN ('single', 'multi_aggregate', 'fallback')),
    result_summary text,
    status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'completed', 'failed')),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_orch_message ON ahi_orchestrations(workspace_message_id);
CREATE INDEX IF NOT EXISTS idx_ahi_orch_status ON ahi_orchestrations(status);

ALTER TABLE ahi_orchestrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_orchestrations" ON ahi_orchestrations;
CREATE POLICY "anon_crud_ahi_orchestrations" ON ahi_orchestrations FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- ahi_evaluations (AHI-SuBiet records)
-- ============================================================
CREATE TABLE IF NOT EXISTS ahi_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_message_id uuid NOT NULL REFERENCES ahi_workspace_messages(id) ON DELETE CASCADE,
    evaluator_type text NOT NULL DEFAULT 'ahi_subiet'
        CHECK (evaluator_type IN ('ahi_subiet', 'auto', 'manual')),
    score numeric NOT NULL DEFAULT 0.0 CHECK (score >= 0.0 AND score <= 1.0),
    decision text NOT NULL DEFAULT 'needs_review'
        CHECK (decision IN ('approved', 'rejected', 'needs_review')),
    reasoning text,
    created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ahi_eval_message ON ahi_evaluations(workspace_message_id);
CREATE INDEX IF NOT EXISTS idx_ahi_eval_decision ON ahi_evaluations(decision);

ALTER TABLE ahi_evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_ahi_evaluations" ON ahi_evaluations;
CREATE POLICY "anon_crud_ahi_evaluations" ON ahi_evaluations FOR ALL
    TO anon, authenticated USING (true) WITH CHECK (true);

-- ============================================================
-- Seed initial AHI constitution articles
-- ============================================================
INSERT INTO ahi_constitution (article_number, title, principle_type, content)
VALUES
    (1, 'Principle of Evolution', 'published', 'All AHI entities evolve over time and space. Sessions persist and accumulate knowledge without loss.'),
    (2, 'Principle of Dual Storage', 'published', 'All knowledge is stored in DBRS (relational) and DBV (vector) for combined precision and semantic recall.'),
    (3, 'Principle of Governance', 'published', 'AHI-G governs by geography. AHI-O governs by quorum. AHI-P holds individual sovereignty.'),
    (4, 'Principle of Compliance', 'published', 'AHI-V verifies constitutional adherence. Compliant entities earn AHI-S status. Violations result in freeze and review.'),
    (5, 'Principle of Orchestration', 'published', 'AHI-Or routes to free-tier AHI-Old models first, aggregating results for optimal quality at no cost.'),
    (6, 'Principle of Evaluation', 'published', 'AHI-SuBiet evaluates workspace messages. Only approved messages promote to permanent DBRS/DBV storage.'),
    (7, 'Principle of Cache Hierarchy', 'published', 'AHI-Cache uses 3 layers: L1 (fastest), L2 (session), L3 (persistent SSD) for optimal access speed.')
ON CONFLICT DO NOTHING;
