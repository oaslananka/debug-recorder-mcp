import type Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { createTestDb } from '../../src/db.js';
import {
  findSimilarErrors,
  searchSessions,
  searchSessionsPage
} from '../../src/search.js';
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

  it('returns pagination metadata, related groups, and Markdown export', () => {
    for (let index = 0; index < 4; index += 1) {
      store.createSession({
        title: `Postgres connection failure ${index}`,
        error_message: 'ECONNREFUSED 127.0.0.1:5432',
        error_type: 'ConnectionError',
        language: 'typescript',
        framework: 'node',
        tags: ['postgres', 'incident']
      });
    }

    const page = searchSessionsPage(
      {
        query: 'postgres connection refused',
        limit: 2,
        offset: 1,
        markdown: true,
        include_related: true
      },
      store,
      db
    );

    expect(page.count).toBe(2);
    expect(page.pagination).toEqual({
      limit: 2,
      offset: 1,
      returned: 2,
      has_more: true,
      next_offset: 3,
      truncated: false,
      window_limit: 500
    });
    expect(page.related_groups).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'tag', value: 'postgres', count: 2 }),
        expect.objectContaining({
          reason: 'error_type',
          value: 'ConnectionError',
          count: 2
        })
      ])
    );
    expect(page.markdown).toContain('# Debug Search Export');
    expect(page.markdown).toContain('## Postmortem prompts');
  });

  it('paginates truthfully beyond the former 1000-result window', () => {
    const insert = db.prepare(`
      INSERT INTO sessions (
        id, title, description, error_message, error_type, stack_trace,
        environment, language, framework, tags, status, created_at, updated_at,
        closed_at
      ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?, '[]', 'open', ?, ?, NULL)
    `);
    const seed = db.transaction(() => {
      for (let index = 0; index < 1_005; index += 1) {
        insert.run(
          `boundary-${index.toString().padStart(4, '0')}`,
          `Boundary pagination failure ${index}`,
          `shared boundary pagination marker ${index}`,
          'boundary pagination failure',
          'BoundaryError',
          index % 2 === 0 ? 'typescript' : 'python',
          'node',
          index,
          index
        );
      }
    });
    seed();

    const nearBoundary = searchSessionsPage(
      { query: 'boundary pagination', limit: 10, offset: 990 },
      store,
      db
    );
    const afterBoundary = searchSessionsPage(
      { query: 'boundary pagination', limit: 10, offset: 1_000 },
      store,
      db
    );

    expect(nearBoundary.results).toHaveLength(10);
    expect(nearBoundary.pagination).toMatchObject({
      has_more: true,
      next_offset: 1_000,
      truncated: false,
      window_limit: null
    });
    expect(afterBoundary.results).toHaveLength(5);
    expect(afterBoundary.pagination).toMatchObject({
      has_more: false,
      next_offset: null,
      truncated: false,
      window_limit: null
    });
    const exactOffsets = [999, 1_000, 1_001].map((offset) =>
      searchSessionsPage(
        { query: 'boundary pagination', limit: 1, offset },
        store,
        db
      )
    );
    expect(exactOffsets.every((page) => page.results.length === 1)).toBe(true);
    expect(new Set(exactOffsets.map((page) => page.results[0]?.id)).size).toBe(
      3
    );
    expect(exactOffsets.every((page) => page.pagination.has_more)).toBe(true);
    expect(
      new Set([
        ...nearBoundary.results.map((result) => result.id),
        ...afterBoundary.results.map((result) => result.id)
      ]).size
    ).toBe(15);
  });

  it('keeps filtered FTS pagination stable across pages', () => {
    for (let index = 0; index < 101; index += 1) {
      store.createSession({
        title: `Filtered pagination failure ${index}`,
        description: 'filtered pagination marker',
        language: index % 2 === 0 ? 'typescript' : 'python',
        framework: 'node',
        tags: []
      });
    }

    const first = searchSessionsPage(
      {
        query: 'filtered pagination',
        language: 'typescript',
        limit: 25,
        offset: 0
      },
      store,
      db
    );
    const second = searchSessionsPage(
      {
        query: 'filtered pagination',
        language: 'typescript',
        limit: 25,
        offset: 25
      },
      store,
      db
    );

    expect(first.pagination.has_more).toBe(true);
    expect(second.pagination.has_more).toBe(true);
    expect(
      first.results.every((result) => result.language === 'typescript')
    ).toBe(true);
    expect(
      second.results.every((result) => result.language === 'typescript')
    ).toBe(true);
    expect(first.results.map((result) => result.id)).not.toEqual(
      second.results.map((result) => result.id)
    );
  });

  it('reports the bounded fallback window instead of claiming full exhaustion', () => {
    for (let index = 0; index < 505; index += 1) {
      store.createSession({
        title: `Fallback marker ${index}`,
        description: 'fallback pagination marker',
        tags: []
      });
    }
    db.exec('DROP TABLE sessions_fts');

    const page = searchSessionsPage(
      { query: 'fallback marker', limit: 10, offset: 490 },
      store,
      db
    );

    expect(page.pagination).toMatchObject({
      truncated: true,
      window_limit: 500
    });
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
