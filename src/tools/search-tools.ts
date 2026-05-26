import type Database from 'better-sqlite3';
import { findSimilarErrors, searchSessions } from '../search.js';
import type { Store } from '../store.js';
import type { FindSimilarErrors, Search } from '../types.js';
import { jsonContent, type ToolHandler } from './common.js';

export function createSearchToolHandlers(store: Store, db: Database.Database) {
  const handleSearchSessions: ToolHandler<Search> = (input) => {
    const results = searchSessions(input, store, db);
    return jsonContent({ count: results.length, results });
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

  return {
    handleSearchSessions,
    handleFindSimilarErrors
  };
}
