function env(key, fallback = '') {
    const value = typeof process !== 'undefined' ? process.env[key] : undefined;
    return value ?? fallback;
}
function intEnv(key, fallback) {
    const value = env(key);
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
export function loadConfig() {
    const apiBaseUrl = env('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:8001');
    return {
        apiBaseUrl,
        supabaseUrl: env('NEXT_PUBLIC_SUPABASE_URL'),
        supabaseAnonKey: env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
        services: {
            organization: {
                name: 'organization',
                baseUrl: apiBaseUrl,
                timeoutMs: intEnv('ORGANIZATION_TIMEOUT_MS', 10_000),
            },
            ai: {
                name: 'ai',
                baseUrl: env('AI_SERVICE_BASE_URL', 'http://localhost:8002'),
                timeoutMs: intEnv('AI_TIMEOUT_MS', 30_000),
            },
            knowledge: {
                name: 'knowledge',
                baseUrl: env('KNOWLEDGE_SERVICE_BASE_URL', 'http://localhost:8003'),
                timeoutMs: intEnv('KNOWLEDGE_TIMEOUT_MS', 30_000),
            },
            erp: {
                name: 'erp',
                baseUrl: env('ERP_SERVICE_BASE_URL', 'http://localhost:8004'),
                timeoutMs: intEnv('ERP_TIMEOUT_MS', 15_000),
            },
        },
    };
}
//# sourceMappingURL=index.js.map