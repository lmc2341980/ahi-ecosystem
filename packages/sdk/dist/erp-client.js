export class ErpClient {
    client;
    constructor(client) {
        this.client = client;
    }
    async listCustomers(params) {
        return this.client.getPaginated('/api/v1/erp/customers', params);
    }
    async listItems(params) {
        return this.client.getPaginated('/api/v1/erp/items', params);
    }
    async listInvoices(params) {
        return this.client.getPaginated('/api/v1/erp/invoices', params);
    }
    async getSyncStatus(system) {
        return this.client.get(`/api/v1/erp/sync/${system}/status`);
    }
    async triggerSync(input) {
        return this.client.post('/api/v1/erp/sync', input);
    }
}
//# sourceMappingURL=erp-client.js.map