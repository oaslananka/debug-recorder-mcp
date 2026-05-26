import { CURRENT_SCHEMA_VERSION } from '../db.js';
import type { Store } from '../store.js';
import type { ExportSessions, GetStats, ImportSessions } from '../types.js';
import { jsonContent, type ToolHandler } from './common.js';

export function createAdminToolHandlers(store: Store) {
  const handleGetStats: ToolHandler<GetStats> = () =>
    jsonContent(store.getStats());

  const handleExportSessions: ToolHandler<ExportSessions> = (input) => {
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

  const handleImportSessions: ToolHandler<ImportSessions> = (input) => {
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
    handleExportSessions,
    handleImportSessions
  };
}
