import type { ERPCustomer, ERPInvoice, ERPItem, ERPSyncRequest, ERPSyncStatus, PaginatedResponse, PaginationParams } from '@ahi/shared';
import { HttpClient } from './http-client';
export declare class ErpClient {
    private readonly client;
    constructor(client: HttpClient);
    listCustomers(params?: PaginationParams): Promise<PaginatedResponse<ERPCustomer>>;
    listItems(params?: PaginationParams): Promise<PaginatedResponse<ERPItem>>;
    listInvoices(params?: PaginationParams): Promise<PaginatedResponse<ERPInvoice>>;
    getSyncStatus(system: string): Promise<ERPSyncStatus>;
    triggerSync(input: ERPSyncRequest): Promise<ERPSyncStatus>;
}
//# sourceMappingURL=erp-client.d.ts.map