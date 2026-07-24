export class SdkError extends Error {
    statusCode;
    detail;
    constructor(statusCode, message, detail) {
        super(message);
        this.statusCode = statusCode;
        this.detail = detail;
        this.name = 'SdkError';
    }
    toApiError() {
        return {
            error: this.name,
            message: this.message,
            statusCode: this.statusCode,
        };
    }
}
export class HttpClient {
    baseUrl;
    timeoutMs;
    headers;
    fetchFn;
    constructor(options) {
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.timeoutMs = options.timeoutMs ?? 10_000;
        this.headers = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options.headers,
        };
        this.fetchFn = options.fetch ?? fetch;
    }
    setAuthToken(token) {
        this.headers.Authorization = `Bearer ${token}`;
    }
    async get(path, params) {
        return this.request('GET', path, undefined, params);
    }
    async post(path, body) {
        return this.request('POST', path, body);
    }
    async put(path, body) {
        return this.request('PUT', path, body);
    }
    async patch(path, body) {
        return this.request('PATCH', path, body);
    }
    async delete(path) {
        return this.request('DELETE', path);
    }
    async getPaginated(path, params) {
        return this.request('GET', path, undefined, params);
    }
    buildUrl(path, params) {
        const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
        if (params) {
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, String(value));
                }
            }
        }
        return url.toString();
    }
    async request(method, path, body, params) {
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
                let detail;
                try {
                    detail = await response.json();
                }
                catch {
                    detail = undefined;
                }
                const message = (typeof detail === 'object' && detail !== null && 'message' in detail
                    ? String(detail.message)
                    : undefined) ?? `HTTP ${response.status}`;
                throw new SdkError(response.status, message, detail);
            }
            if (response.status === 204)
                return undefined;
            return (await response.json());
        }
        finally {
            clearTimeout(timeout);
        }
    }
}
//# sourceMappingURL=http-client.js.map