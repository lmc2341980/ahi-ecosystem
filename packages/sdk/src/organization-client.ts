import type {
  CreateOrganizationInput,
  InviteMemberInput,
  Organization,
  OrganizationMember,
  PaginatedResponse,
  PaginationParams,
  UpdateMemberRoleInput,
  UpdateOrganizationInput,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class OrganizationClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async list(params?: PaginationParams): Promise<PaginatedResponse<Organization>> {
    return this.client.getPaginated<Organization>('/api/v1/organizations', params);
  }

  async get(id: string): Promise<Organization> {
    return this.client.get<Organization>(`/api/v1/organizations/${id}`);
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    return this.client.post<Organization>('/api/v1/organizations', input);
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    return this.client.patch<Organization>(`/api/v1/organizations/${id}`, input);
  }

  async delete(id: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/organizations/${id}`);
  }

  async listMembers(
    orgId: string,
    params?: PaginationParams,
  ): Promise<PaginatedResponse<OrganizationMember>> {
    return this.client.getPaginated<OrganizationMember>(
      `/api/v1/organizations/${orgId}/members`,
      params,
    );
  }

  async inviteMember(orgId: string, input: InviteMemberInput): Promise<OrganizationMember> {
    return this.client.post<OrganizationMember>(
      `/api/v1/organizations/${orgId}/members`,
      input,
    );
  }

  async updateMemberRole(
    orgId: string,
    memberId: string,
    input: UpdateMemberRoleInput,
  ): Promise<OrganizationMember> {
    return this.client.patch<OrganizationMember>(
      `/api/v1/organizations/${orgId}/members/${memberId}`,
      input,
    );
  }

  async removeMember(orgId: string, memberId: string): Promise<void> {
    await this.client.delete<void>(`/api/v1/organizations/${orgId}/members/${memberId}`);
  }
}
