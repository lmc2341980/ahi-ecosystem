export class OrganizationClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async list(params) {
        return this.client.getPaginated('/api/v1/organizations', params);
    }
    async get(id) {
        return this.client.get(`/api/v1/organizations/${id}`);
    }
    async create(input) {
        return this.client.post('/api/v1/organizations', input);
    }
    async update(id, input) {
        return this.client.patch(`/api/v1/organizations/${id}`, input);
    }
    async delete(id) {
        await this.client.delete(`/api/v1/organizations/${id}`);
    }
    async listMembers(orgId, params) {
        return this.client.getPaginated(`/api/v1/organizations/${orgId}/members`, params);
    }
    async inviteMember(orgId, input) {
        return this.client.post(`/api/v1/organizations/${orgId}/members`, input);
    }
    async updateMemberRole(orgId, memberId, input) {
        return this.client.patch(`/api/v1/organizations/${orgId}/members/${memberId}`, input);
    }
    async removeMember(orgId, memberId) {
        await this.client.delete(`/api/v1/organizations/${orgId}/members/${memberId}`);
    }
}
//# sourceMappingURL=organization-client.js.map