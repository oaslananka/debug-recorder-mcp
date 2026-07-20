import { CURRENT_SCHEMA_VERSION } from '../db.js';
import { getDiagnostics } from '../diagnostics.js';
import type { Store } from '../store.js';
import {
  BACKUP_FORMAT_VERSION,
  type ExportSessions,
  type GetDiagnostics,
  type GetStats,
  type ImportSessions
} from '../types.js';
import { jsonContent, type ToolHandler } from './common.js';

export function createAdminToolHandlers(store: Store) {
  const handleGetStats: ToolHandler<GetStats> = () =>
    jsonContent(store.getStats());

  const handleGetDiagnostics: ToolHandler<GetDiagnostics> = () =>
    jsonContent(
      getDiagnostics(store, { dbPath: process.env.DEBUG_RECORDER_DB })
    );

  const handleExportSessions: ToolHandler<ExportSessions> = (input) => {
    const exported = store.exportAll();

    if (input.format === 'summary') {
      return jsonContent({
        format: 'summary',
        exported_at: new Date().toISOString(),
        format_version: BACKUP_FORMAT_VERSION,
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
      format: 'json',
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
    handleGetDiagnostics,
    handleExportSessions,
    handleImportSessions
  };
}
