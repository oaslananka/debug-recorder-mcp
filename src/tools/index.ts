import type Database from 'better-sqlite3';
import type { Store } from '../store.js';
import { createAdminToolHandlers } from './admin-tools.js';
import { createRecordingToolHandlers } from './recording-tools.js';
import { createSearchToolHandlers } from './search-tools.js';
import { createSessionToolHandlers } from './session-tools.js';

export function createSplitToolHandlers(store: Store, db: Database.Database) {
  return {
    ...createSessionToolHandlers(store),
    ...createRecordingToolHandlers(store),
    ...createSearchToolHandlers(store, db),
    ...createAdminToolHandlers(store)
  };
}

export type DebugRecorderToolHandlers = ReturnType<
  typeof createSplitToolHandlers
>;
