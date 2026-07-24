export interface ServiceConfig {
    name: string;
    baseUrl: string;
    timeoutMs: number;
}
export interface AppConfig {
    apiBaseUrl: string;
    supabaseUrl: string;
    supabaseAnonKey: string;
    services: {
        organization: ServiceConfig;
        ai: ServiceConfig;
        knowledge: ServiceConfig;
        erp: ServiceConfig;
    };
}
export declare function loadConfig(): AppConfig;
//# sourceMappingURL=index.d.ts.map