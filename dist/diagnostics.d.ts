import type { Store } from './store.js';
export type DiagnosticEvent = 'session_created' | 'search' | 'import' | 'export';
export type HttpRejectionReason = 'body_too_large' | 'forbidden_host' | 'forbidden_origin' | 'method_not_allowed' | 'parse_error' | 'unauthorized' | 'unsupported_media_type' | 'other';
export type DiagnosticCounters = {
    sessions_created: number;
    searches: number;
    imports: number;
    exports: number;
    http_rejections: Record<HttpRejectionReason, number>;
};
export declare function redactDiagnosticPayload(value: unknown): unknown;
export declare function recordDiagnosticEvent(event: DiagnosticEvent): void;
export declare function recordHttpRejection(reason: HttpRejectionReason): void;
export declare function resetDiagnosticCounters(): void;
export declare function getDiagnostics(store: Store, options?: {
    dbPath?: string;
}): {
    app: {
        name: string;
        version: string;
        schema_version: number;
    };
    runtime: {
        node: string;
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
    };
    config: {
        database_path: string;
        database_path_configured: boolean;
        redact_before_store: boolean;
        remote_http: boolean;
        http_auth_configured: boolean;
        allowed_hosts_configured: boolean;
        allowed_origins_configured: boolean;
        log_level: string;
    };
    counters: DiagnosticCounters;
    stats: {
        total: number;
        resolved: number;
        open: number;
        abandoned: number;
        byLanguage: Array<{
            language: string;
            count: number;
        }>;
        topErrorTypes: Array<{
            error_type: string;
            count: number;
        }>;
        resolutionRate: number;
    };
};
//# sourceMappingURL=diagnostics.d.ts.map