import { CURRENT_SCHEMA_VERSION } from './db.js';
import { redactSecrets } from './logging.js';
import { NAME, VERSION } from './version.js';
const ABSOLUTE_PATH_PATTERN = /(?:[A-Za-z]:\\[^\s)\]}]+|\/(?:Users|home|var|tmp|mnt|workspace|srv|opt)\/[^\s)\]}]+)/g;
const counters = {
    sessions_created: 0,
    searches: 0,
    imports: 0,
    exports: 0,
    http_rejections: {
        body_too_large: 0,
        forbidden_host: 0,
        forbidden_origin: 0,
        method_not_allowed: 0,
        parse_error: 0,
        unauthorized: 0,
        unsupported_media_type: 0,
        other: 0
    }
};
function cloneCounters() {
    return {
        sessions_created: counters.sessions_created,
        searches: counters.searches,
        imports: counters.imports,
        exports: counters.exports,
        http_rejections: { ...counters.http_rejections }
    };
}
function redactPaths(value) {
    if (typeof value === 'string') {
        return value.replace(ABSOLUTE_PATH_PATTERN, '[PATH]');
    }
    if (Array.isArray(value)) {
        return value.map((item) => redactPaths(item));
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([key, item]) => [
            key,
            redactPaths(item)
        ]));
    }
    return value;
}
export function redactDiagnosticPayload(value) {
    return redactPaths(redactSecrets(value));
}
export function recordDiagnosticEvent(event) {
    if (event === 'session_created') {
        counters.sessions_created += 1;
        return;
    }
    if (event === 'search') {
        counters.searches += 1;
        return;
    }
    if (event === 'import') {
        counters.imports += 1;
        return;
    }
    counters.exports += 1;
}
export function recordHttpRejection(reason) {
    counters.http_rejections[reason] += 1;
}
export function resetDiagnosticCounters() {
    counters.sessions_created = 0;
    counters.searches = 0;
    counters.imports = 0;
    counters.exports = 0;
    for (const reason of Object.keys(counters.http_rejections)) {
        counters.http_rejections[reason] = 0;
    }
}
function isEnabled(value) {
    return value?.toLowerCase() === 'true';
}
function summarizeConfig(dbPath) {
    return {
        database_path: dbPath ? '[CONFIGURED]' : '[DEFAULT]',
        database_path_configured: dbPath !== undefined,
        redact_before_store: isEnabled(process.env.DEBUG_RECORDER_REDACT_BEFORE_STORE),
        remote_http: isEnabled(process.env.DEBUG_RECORDER_REMOTE_HTTP),
        http_auth_configured: Boolean(process.env.DEBUG_RECORDER_HTTP_TOKEN),
        allowed_hosts_configured: Boolean(process.env.DEBUG_RECORDER_ALLOWED_HOSTS),
        allowed_origins_configured: Boolean(process.env.DEBUG_RECORDER_ALLOWED_ORIGINS),
        log_level: process.env.LOG_LEVEL ?? 'info'
    };
}
export function getDiagnostics(store, options = {}) {
    const diagnostics = {
        app: {
            name: NAME,
            version: VERSION,
            schema_version: CURRENT_SCHEMA_VERSION
        },
        runtime: {
            node: process.version,
            platform: process.platform,
            arch: process.arch
        },
        config: summarizeConfig(options.dbPath),
        counters: cloneCounters(),
        stats: store.getStats()
    };
    return redactDiagnosticPayload(diagnostics);
}
//# sourceMappingURL=diagnostics.js.map