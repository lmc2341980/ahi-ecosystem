export type UUID = string;

export type ISODateString = string;

export type ServiceName =
  | 'organization'
  | 'ai'
  | 'knowledge'
  | 'erp';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  [key: string]: unknown;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}

export type Result<T, E = ApiError> =
  | { ok: true; value: T }
  | { ok: false; error: E };
