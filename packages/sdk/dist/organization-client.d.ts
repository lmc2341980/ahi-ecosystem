import type { CreateOrganizationInput, InviteMemberInput, Organization, OrganizationMember, PaginatedResponse, PaginationParams, UpdateMemberRoleInput, UpdateOrganizationInput } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class OrganizationClient {
    private readonly client;
    constructor(client: HttpClient);
    list(params?: PaginationParams): Promise<PaginatedResponse<Organization>>;
    get(id: string): Promise<Organization>;
    create(input: CreateOrganizationInput): Promise<Organization>;
    update(id: string, input: UpdateOrganizationInput): Promise<Organization>;
    delete(id: string): Promise<void>;
    listMembers(orgId: string, params?: PaginationParams): Promise<PaginatedResponse<OrganizationMember>>;
    inviteMember(orgId: string, input: InviteMemberInput): Promise<OrganizationMember>;
    updateMemberRole(orgId: string, memberId: string, input: UpdateMemberRoleInput): Promise<OrganizationMember>;
    removeMember(orgId: string, memberId: string): Promise<void>;
}
//# sourceMappingURL=organization-client.d.ts.map