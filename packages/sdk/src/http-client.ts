import type { ApiError, PaginatedResponse, PaginationParams } from '@ahi/shared';

export class SdkError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly detail?: unknown,
  ) {
    super(message);
    this.name = 'SdkError';
  }

  toApiError(): ApiError {
    return {
      error: this.name,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}

export interface HttpClientOptions {
  baseUrl: string;
  timeoutMs?: number;
  headers?: Record<string, string>;
  fetch?: typeof fetch;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly headers: Record<string, string>;
  private readonly fetchFn: typeof fetch;

  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    };
    this.fetchFn = options.fetch ?? fetch;
  }

  setAuthToken(token: string): void {
    this.headers.Authorization = `Bearer ${token}`;
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    return this.request<T>('GET', path, undefined, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  async getPaginated<T>(
    path: string,
    params?: PaginationParams & Record<string, unknown>,
  ): Promise<PaginatedResponse<T>> {
    return this.request<PaginatedResponse<T>>('GET', path, undefined, params);
  }

  private buildUrl(path: string, params?: Record<string, unknown>): string {
    const url = new URL(
      path.startsWith('http') ? path : `${this.baseUrl}${path}`,
    );
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, unknown>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(url, {
        method,
        headers: this.headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        let detail: unknown;
        try {
          detail = await response.json();
        } catch {
          detail = undefined;
        }
        const message =
          (typeof detail === 'object' && detail !== null && 'message' in detail
            ? String((detail as { message: unknown }).message)
            : undefined) ?? `HTTP ${response.status}`;
        throw new SdkError(response.status, message, detail);
      }

      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
