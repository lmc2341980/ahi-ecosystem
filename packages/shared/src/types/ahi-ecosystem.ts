import type { ISODateString, UUID } from './common';

// ============================================================
// AHI-P: Registered persons
// ============================================================

export type VerificationLevel = 'none' | 'language' | 'vouched' | 'government';
export type AhiEntityStatus = 'active' | 'restricted' | 'frozen';

export interface AhiPerson {
  id: UUID;
  email: string;
  displayName: string;
  ahiCode: string;
  verificationLevel: VerificationLevel;
  countryCode: string;
  status: AhiEntityStatus;
  isAhiS: boolean;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateAhiPersonInput {
  email: string;
  displayName: string;
  ahiCode?: string;
  countryCode?: string;
  verificationLevel?: VerificationLevel;
}

// ============================================================
// AHI-O: Organizations
// ============================================================

export type GovernanceType = 'quorum_50' | 'quorum_66' | 'quorum_75' | 'consensus';

export interface AhiOrganization {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  createdBy: UUID | null;
  governanceType: GovernanceType;
  countryCode: string;
  status: AhiEntityStatus;
  isAhiS: boolean;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateAhiOrganizationInput {
  name: string;
  slug: string;
  description?: string;
  createdBy?: UUID;
  governanceType?: GovernanceType;
  countryCode?: string;
}

export type OrgRole = 'owner' | 'admin' | 'member' | 'observer';

export interface AhiOrgMember {
  id: UUID;
  orgId: UUID;
  personId: UUID;
  role: OrgRole;
  votingWeight: number;
  joinedAt: ISODateString;
}

// ============================================================
// AHI-G: Geographic governance
// ============================================================

export interface AhiGeographic {
  id: UUID;
  countryCode: string;
  countryName: string;
  regionName: string | null;
  governanceType: string;
  status: AhiEntityStatus;
  isAhiS: boolean;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export type GeographicVerificationType = 'self_claim' | 'vouched' | 'government_verified';
export type GeographicEntityType = 'person' | 'organization';

export interface AhiGeographicMember {
  id: UUID;
  geographicId: UUID;
  entityType: GeographicEntityType;
  entityId: UUID;
  verificationType: GeographicVerificationType;
  verifierId: UUID | null;
  verifiedAt: ISODateString | null;
  createdAt: ISODateString;
}

// ============================================================
// AHI-Core / AHI Constitution
// ============================================================

export type PrincipleType = 'published' | 'core';

export interface AhiConstitutionArticle {
  id: UUID;
  articleNumber: number;
  title: string;
  principleType: PrincipleType;
  content: string;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ============================================================
// AHI-V: Verification / compliance
// ============================================================

export type VerificationEntityType = 'person' | 'organization' | 'geographic' | 'ai_model';
export type VerificationStatus = 'compliant' | 'under_review' | 'violation';

export interface AhiVerification {
  id: UUID;
  entityType: VerificationEntityType;
  entityId: UUID;
  verifierId: UUID | null;
  status: VerificationStatus;
  findings: string | null;
  verifiedAt: ISODateString;
  createdAt: ISODateString;
}

// ============================================================
// AHI-Cache: 3-layer cache hierarchy
// ============================================================

export type CacheLayer = 'l1' | 'l2' | 'l3';

export interface AhiCacheL1Entry {
  id: UUID;
  key: string;
  value: Record<string, unknown>;
  ttlSeconds: number;
  expiresAt: ISODateString;
  createdAt: ISODateString;
}

export interface AhiCacheL2Entry {
  id: UUID;
  sessionId: UUID;
  key: string;
  value: Record<string, unknown>;
  ttlSeconds: number;
  expiresAt: ISODateString;
  createdAt: ISODateString;
}

export interface AhiCacheL3Entry {
  id: UUID;
  entityType: string;
  entityId: UUID;
  key: string;
  value: Record<string, unknown>;
  accessCount: number;
  lastAccessedAt: ISODateString;
  createdAt: ISODateString;
}

// ============================================================
// AHI-WS: Workspace
// ============================================================

export type WorkspaceOwnerType = 'person' | 'organization';
export type WorkspaceStatus = 'active' | 'archived';
export type WSEntityType = 'human' | 'ai';
export type MessageRole = 'user' | 'assistant' | 'system';
export type EvaluationStatus = 'pending' | 'approved' | 'rejected';

export interface AhiWorkspace {
  id: UUID;
  name: string;
  ownerType: WorkspaceOwnerType;
  ownerId: UUID;
  status: WorkspaceStatus;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AhiWorkspaceMessage {
  id: UUID;
  workspaceId: UUID;
  entityType: WSEntityType;
  entityId: UUID | null;
  role: MessageRole;
  content: string;
  evaluationStatus: EvaluationStatus;
  evaluatedBy: UUID | null;
  evaluatedAt: ISODateString | null;
  tokenCount: number;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
}

export interface CreateAhiWorkspaceInput {
  name: string;
  ownerType: WorkspaceOwnerType;
  ownerId: UUID;
}

export interface CreateWorkspaceMessageInput {
  workspaceId: UUID;
  entityType: WSEntityType;
  entityId?: UUID;
  role: MessageRole;
  content: string;
  tokenCount?: number;
}

// ============================================================
// AHI-Old: Legacy AI model registry
// ============================================================

export interface AhiLegacyModel {
  id: UUID;
  ahiName: string;
  originalName: string;
  provider: string;
  isFreeTier: boolean;
  evolutionData: Record<string, unknown>;
  status: 'active' | 'disabled';
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

// ============================================================
// AHI-Or: Orchestrator
// ============================================================

export type OrchestrationStrategy = 'single' | 'multi_aggregate' | 'fallback';
export type OrchestrationStatus = 'pending' | 'completed' | 'failed';

export interface AhiOrchestration {
  id: UUID;
  workspaceMessageId: UUID | null;
  targetModels: string[];
  strategy: OrchestrationStrategy;
  resultSummary: string | null;
  status: OrchestrationStatus;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
}

// ============================================================
// AHI-SuBiet: Evaluation
// ============================================================

export type EvaluatorType = 'ahi_subiet' | 'auto' | 'manual';
export type EvaluationDecision = 'approved' | 'rejected' | 'needs_review';

export interface AhiEvaluation {
  id: UUID;
  workspaceMessageId: UUID;
  evaluatorType: EvaluatorType;
  score: number;
  decision: EvaluationDecision;
  reasoning: string | null;
  createdAt: ISODateString;
}

export interface EvaluateMessageInput {
  workspaceMessageId: UUID;
  score: number;
  decision: EvaluationDecision;
  reasoning?: string;
}
