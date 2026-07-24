import type { ApiError, PaginatedResponse, PaginationParams } from '@ahi/shared';
export declare class SdkError extends Error {
    readonly statusCode: number;
    readonly detail?: unknown | undefined;
    constructor(statusCode: number, message: string, detail?: unknown | undefined);
    toApiError(): ApiError;
}
export interface HttpClientOptions {
    baseUrl: string;
    timeoutMs?: number;
    headers?: Record<string, string>;
    fetch?: typeof fetch;
}
export declare class HttpClient {
    private readonly baseUrl;
    private readonly timeoutMs;
    private readonly headers;
    private readonly fetchFn;
    constructor(options: HttpClientOptions);
    setAuthToken(token: string): void;
    get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
    getPaginated<T>(path: string, params?: PaginationParams & Record<string, unknown>): Promise<PaginatedResponse<T>>;
    private buildUrl;
    private request;
}
//# sourceMappingURL=http-client.d.ts.map