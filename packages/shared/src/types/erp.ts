import type { ISODateString } from './common';

export type ERPSystem = 'erpnext' | 'internal';

export type ERPEntityType = 'customer' | 'supplier' | 'item' | 'invoice' | 'order';

export interface ERPCustomer {
  id: string;
  system: ERPSystem;
  name: string;
  email: string | null;
  phone: string | null;
  currency: string;
  creditLimit: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ERPItem {
  id: string;
  system: ERPSystem;
  name: string;
  sku: string;
  description: string | null;
  unitPrice: number;
  currency: string;
  stockQuantity: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ERPInvoice {
  id: string;
  system: ERPSystem;
  number: string;
  customerId: string;
  status: 'draft' | 'submitted' | 'paid' | 'overdue' | 'cancelled';
  total: number;
  currency: string;
  issueDate: ISODateString;
  dueDate: ISODateString;
}

export interface ERPSyncStatus {
  system: ERPSystem;
  lastSyncAt: ISODateString | null;
  status: 'idle' | 'syncing' | 'error';
  recordsProcessed: number;
  errorMessage: string | null;
}

export interface ERPSyncRequest {
  system: ERPSystem;
  entityType: ERPEntityType;
  fullSync: boolean;
}
