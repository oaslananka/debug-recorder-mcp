import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import { findSimilarErrors, searchSessions } from '../../src/search.js';
import { Store } from '../../src/store.js';

describe('search', () => {
  let db: Database.Database;
  let store: Store;

  beforeEach(() => {
    db = createTestDb();
    store = new Store(db);
  });

  afterEach(() => {
    db.close();
  });

  it('finds sessions beyond the old 500 record limit', () => {
    store.createSession({
      title: 'TypeError in legacy parser',
      error_message: 'Cannot read properties of undefined',
      error_type: 'TypeError',
      description: 'legacy parser failure',
      tags: ['legacy']
    });

    for (let index = 0; index < 520; index += 1) {
      store.createSession({
        title: `noise session ${index}`,
        description: `generic failure ${index}`,
        tags: []
      });
    }

    const results = searchSessions(
      {
        query: 'legacy parser undefined',
        limit: 5
      },
      store,
      db
    );

    expect(
      results.some((result) => result.title === 'TypeError in legacy parser')
    ).toBe(true);
  });

  it('applies status and framework filters in FTS search', () => {
    const next = store.createSession({
      title: 'Route crash',
      error_message: 'Cannot read properties of undefined',
      framework: 'nextjs',
      tags: []
    });
    const django = store.createSession({
      title: 'Serializer crash',
      error_message: 'ValueError in serializer',
      framework: 'django',
      tags: []
    });

    store.closeSession({ session_id: next.id, status: 'resolved' });
    store.closeSession({ session_id: django.id, status: 'abandoned' });

    const results = searchSessions(
      {
        query: 'crash',
        framework: 'nextjs',
        status: 'resolved',
        limit: 10
      },
      store,
      db
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.framework).toBe('nextjs');
    expect(results[0]?.status).toBe('resolved');
  });

  it('re-ranks the most precise session first', () => {
    store.createSession({
      title: 'TypeError in auth middleware',
      error_message: 'Cannot read property user of undefined',
      tags: ['auth']
    });
    store.createSession({
      title: 'Middleware warning',
      error_message: 'Undefined value seen in middleware',
      tags: ['middleware']
    });

    const results = searchSessions(
      {
        query: 'typeerror auth middleware user undefined',
        limit: 2
      },
      store,
      db
    );

    expect(results[0]?.title).toBe('TypeError in auth middleware');
  });

  it('sanitizes special characters in search queries', () => {
    store.createSession({
      title: 'Parser failure',
      description: 'parser cannot read payload',
      tags: ['parser']
    });

    const results = searchSessions(
      {
        query: 'parser() "payload"*',
        limit: 5
      },
      store,
      db
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.title).toBe('Parser failure');
  });

  it('finds similar errors and returns a similarity score', () => {
    store.createSession({
      title: 'TypeError in API route',
      error_message: 'Cannot read properties of undefined (reading user)',
      error_type: 'TypeError',
      tags: ['api']
    });

    const similar = findSimilarErrors(
      'Cannot read properties of undefined (reading user)',
      store,
      db,
      5
    );

    expect(similar).toHaveLength(1);
    expect(similar[0]?.similarity).toBeGreaterThanOrEqual(90);
  });

  it('returns empty results for special-character-only queries and no-error histories', () => {
    store.createSession({
      title: 'noise',
      description: 'no searchable error',
      tags: []
    });

    const searchResults = searchSessions(
      {
        query: '***(()',
        limit: 5
      },
      store,
      db
    );
    const similar = findSimilarErrors('missing error', store, db, 5);

    expect(searchResults).toHaveLength(0);
    expect(similar).toHaveLength(0);
  });
});
