import type Database from 'better-sqlite3';
import { recordDiagnosticEvent } from '../diagnostics.js';
import { findSimilarErrors, searchSessionsPage } from '../search.js';
import type { Store } from '../store.js';
import type {
  DeleteSearchPreset,
  FindSimilarErrors,
  ListSearchPresets,
  SaveSearchPreset,
  Search
} from '../types.js';
import { jsonContent, type ToolHandler } from './common.js';

export function createSearchToolHandlers(store: Store, db: Database.Database) {
  const handleSearchSessions: ToolHandler<Search> = (input) => {
    recordDiagnosticEvent('search');
    return jsonContent(searchSessionsPage(input, store, db));
  };

  const handleFindSimilarErrors: ToolHandler<FindSimilarErrors> = (input) => {
    const results = findSimilarErrors(
      input.error_message,
      store,
      db,
      input.limit
    );

    return jsonContent({
      found: results.length,
      message:
        results.length > 0
          ? `Found ${results.length} similar past errors`
          : 'No similar errors found in history',
      results
    });
  };

  const handleSaveSearchPreset: ToolHandler<SaveSearchPreset> = (input) =>
    jsonContent({ success: true, preset: store.saveSearchPreset(input) });

  const handleListSearchPresets: ToolHandler<ListSearchPresets> = () => {
    const presets = store.listSearchPresets();
    return jsonContent({ count: presets.length, presets });
  };

  const handleDeleteSearchPreset: ToolHandler<DeleteSearchPreset> = (input) =>
    jsonContent({
      success: true,
      name: input.name,
      deleted: store.removeSearchPreset(input.name)
    });

  return {
    handleSearchSessions,
    handleFindSimilarErrors,
    handleSaveSearchPreset,
    handleListSearchPresets,
    handleDeleteSearchPreset
  };
}
