import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import { findSimilarErrors, searchSessions } from '../../src/search.js';
import { Store } from '../../src/store.js';

describe('hybrid search integration', () => {
  let db: Database.Database;
  let store: Store;

  beforeEach(() => {
    db = createTestDb();
    store = new Store(db);
  });

  afterEach(() => {
    delete process.env.FUZZY_THRESHOLD;
    db.close();
  });

  it('finds typo-tolerant results via Fuse reranking when the FTS candidate set exists', () => {
    store.createSession({
      title: 'Database refusal on startup',
      error_message: 'ECONNREFUSED 127.0.0.1:5432',
      tags: ['postgres']
    });

    const results = searchSessions(
      {
        query: 'econnrefusd 127.0.0.1',
        limit: 5
      },
      store,
      db
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.error_message).toContain('ECONNREFUSED');
  });

  it('prefers exact technical terms for ranking', () => {
    store.createSession({
      title: 'Primary postgres outage',
      error_message: 'ECONNREFUSED 127.0.0.1:5432',
      tags: ['postgres']
    });
    store.createSession({
      title: 'Generic local connection issue',
      error_message: 'Connection failed locally',
      tags: ['noise']
    });

    const results = searchSessions(
      {
        query: 'ECONNREFUSED 5432',
        limit: 2
      },
      store,
      db
    );

    expect(results[0]?.title).toBe('Primary postgres outage');
  });

  it('applies status, language, and framework filters together', () => {
    const tsNext = store.createSession({
      title: 'Next route crash',
      error_message: 'Cannot serialize response',
      language: 'typescript',
      framework: 'nextjs',
      tags: []
    });
    const tsExpress = store.createSession({
      title: 'Express route crash',
      error_message: 'Cannot serialize response',
      language: 'typescript',
      framework: 'express',
      tags: []
    });

    store.closeSession({ session_id: tsNext.id, status: 'resolved' });
    store.closeSession({ session_id: tsExpress.id, status: 'abandoned' });

    const results = searchSessions(
      {
        query: 'serialize response',
        status: 'resolved',
        language: 'typescript',
        framework: 'nextjs',
        limit: 10
      },
      store,
      db
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe(tsNext.id);
  });

  it('keeps FTS results fresh after updates and deletes', () => {
    const session = store.createSession({
      title: 'Old title',
      description: 'initial state',
      tags: ['fts']
    });

    store.updateSession(session.id, {
      title: 'Updated parser failure',
      description: 'new searchable content'
    });

    const updatedResults = searchSessions(
      {
        query: 'parser failure',
        limit: 5
      },
      store,
      db
    );

    expect(updatedResults.map((result) => result.id)).toContain(session.id);

    store.deleteSession(session.id);

    const afterDelete = searchSessions(
      {
        query: 'parser failure',
        limit: 5
      },
      store,
      db
    );

    expect(afterDelete.map((result) => result.id)).not.toContain(session.id);
  });

  it('continues to search histories larger than 500 sessions', () => {
    for (let index = 0; index < 550; index += 1) {
      store.createSession({
        title: `noise ${index}`,
        description: `generic search noise ${index}`,
        tags: []
      });
    }

    store.createSession({
      title: 'Large history target',
      error_message: 'Cannot read properties of null (reading profile)',
      tags: ['target']
    });

    const results = searchSessions(
      {
        query: 'null reading profile',
        limit: 5
      },
      store,
      db
    );

    expect(
      results.some((result) => result.title === 'Large history target')
    ).toBe(true);
  });

  it('uses the configured fuzzy threshold for similar error lookups', () => {
    process.env.FUZZY_THRESHOLD = '0.6';

    store.createSession({
      title: 'Widget lookup failure',
      error_message: 'Cannot read properties of undefined (reading widget)',
      error_type: 'TypeError',
      tags: ['widget']
    });

    const similar = findSimilarErrors(
      'Cannot reed properteis of undefined reading widjet',
      store,
      db,
      5
    );

    expect(similar).toHaveLength(1);
    expect(similar[0]?.similarity).toBeGreaterThan(0);
  });
});
