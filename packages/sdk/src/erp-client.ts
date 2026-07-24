import type {
  ERPCustomer,
  ERPInvoice,
  ERPItem,
  ERPSyncRequest,
  ERPSyncStatus,
  PaginatedResponse,
  PaginationParams,
} from '@ahi/shared';
import { HttpClient } from './http-client';

export class ErpClient {
  private readonly client: HttpClient;

  constructor(client: HttpClient) {
    this.client = client;
  }

  async listCustomers(params?: PaginationParams): Promise<PaginatedResponse<ERPCustomer>> {
    return this.client.getPaginated<ERPCustomer>('/api/v1/erp/customers', params);
  }

  async listItems(params?: PaginationParams): Promise<PaginatedResponse<ERPItem>> {
    return this.client.getPaginated<ERPItem>('/api/v1/erp/items', params);
  }

  async listInvoices(params?: PaginationParams): Promise<PaginatedResponse<ERPInvoice>> {
    return this.client.getPaginated<ERPInvoice>('/api/v1/erp/invoices', params);
  }

  async getSyncStatus(system: string): Promise<ERPSyncStatus> {
    return this.client.get<ERPSyncStatus>(`/api/v1/erp/sync/${system}/status`);
  }

  async triggerSync(input: ERPSyncRequest): Promise<ERPSyncStatus> {
    return this.client.post<ERPSyncStatus>('/api/v1/erp/sync', input);
  }
}
