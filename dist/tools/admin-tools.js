import { CURRENT_SCHEMA_VERSION } from '../db.js';
import { getDiagnostics } from '../diagnostics.js';
import { jsonContent } from './common.js';
export function createAdminToolHandlers(store) {
    const handleGetStats = () => jsonContent(store.getStats());
    const handleGetDiagnostics = () => jsonContent(getDiagnostics(store, { dbPath: process.env.DEBUG_RECORDER_DB }));
    const handleExportSessions = (input) => {
        const exported = store.exportAll();
        if (input.format === 'summary') {
            return jsonContent({
                exported_at: new Date().toISOString(),
                schema_version: CURRENT_SCHEMA_VERSION,
                stats: store.getStats(),
                sessions: exported.sessions.map((session) => ({
                    id: session.id,
                    title: session.title,
                    status: session.status,
                    language: session.language,
                    error_type: session.error_type,
                    created_at: new Date(session.created_at).toISOString()
                }))
            });
        }
        return jsonContent({
            exported_at: new Date().toISOString(),
            ...exported
        });
    };
    const handleImportSessions = (input) => {
        const result = store.importAll(input.payload, {
            skipExisting: input.skip_existing
        });
        return jsonContent({
            success: true,
            ...result
        });
    };
    return {
        handleGetStats,
        handleGetDiagnostics,
        handleExportSessions,
        handleImportSessions
    };
}
//# sourceMappingURL=admin-tools.js.map