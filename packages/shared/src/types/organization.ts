import type { ISODateString, UUID } from './common';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export type OrganizationStatus = 'active' | 'suspended' | 'archived';

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  status: OrganizationStatus;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface OrganizationMember {
  id: UUID;
  organizationId: UUID;
  userId: UUID;
  email: string;
  role: OrganizationRole;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface CreateOrganizationInput {
  name: string;
  slug: string;
  description?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  description?: string;
  status?: OrganizationStatus;
}

export interface InviteMemberInput {
  email: string;
  role: OrganizationRole;
}

export interface UpdateMemberRoleInput {
  role: OrganizationRole;
}
