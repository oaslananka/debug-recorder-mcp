import type Database from 'better-sqlite3';
import Fuse from 'fuse.js';
import type { Store } from './store.js';
import type { Search, Session } from './types.js';

export type SearchResult = Session & { _score: number | undefined };

type FtsCandidateRow = {
  session_id: string;
  rank: number;
};

const DEFAULT_FUZZY_THRESHOLD = 0.5;

function getFuzzyThreshold(): number {
  const configured = Number.parseFloat(
    process.env.FUZZY_THRESHOLD ?? `${DEFAULT_FUZZY_THRESHOLD}`
  );

  if (!Number.isFinite(configured) || configured < 0 || configured > 1) {
    return DEFAULT_FUZZY_THRESHOLD;
  }

  return configured;
}

function buildMatchQuery(query: string): string | null {
  const terms = query
    .replace(/["'*^():]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (terms.length === 0) {
    return null;
  }

  return terms.map((term) => `${term}*`).join(' ');
}

function rerankCandidates(
  query: string,
  candidates: Session[],
  limit: number
): Array<{ item: Session; score: number | undefined }> {
  const threshold = getFuzzyThreshold();
  const fuse = new Fuse(candidates, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'error_message', weight: 0.35 },
      { name: 'error_type', weight: 0.15 },
      { name: 'description', weight: 0.05 },
      { name: 'tags', weight: 0.05 }
    ],
    threshold,
    includeScore: true
  });

  const reranked = fuse.search(query, { limit });

  if (reranked.length > 0) {
    return reranked.map((result) => ({
      item: result.item,
      score: result.score
    }));
  }

  return candidates.slice(0, limit).map((candidate) => ({
    item: candidate,
    score: undefined
  }));
}

function fuseOnlySearch(params: Search, store: Store): SearchResult[] {
  const threshold = getFuzzyThreshold();
  const sessions = store.listSessions({
    status: params.status,
    language: params.language,
    framework: params.framework,
    limit: 500,
    offset: 0
  });

  if (sessions.length === 0) {
    return [];
  }

  const fuse = new Fuse(sessions, {
    keys: [
      { name: 'title', weight: 0.4 },
      { name: 'error_message', weight: 0.35 },
      { name: 'error_type', weight: 0.15 },
      { name: 'description', weight: 0.05 },
      { name: 'tags', weight: 0.05 }
    ],
    threshold,
    includeScore: true
  });

  return fuse.search(params.query, { limit: params.limit }).map((result) => ({
    ...result.item,
    _score: result.score
  }));
}

function queryFtsCandidates(
  query: string,
  limit: number,
  db: Database.Database,
  filters?: Pick<Search, 'language' | 'framework' | 'status'>
): FtsCandidateRow[] {
  const matchQuery = buildMatchQuery(query);

  if (!matchQuery) {
    return [];
  }

  let sql = `
    SELECT base.id as session_id, bm25(sessions_fts) as rank
    FROM sessions_fts
    JOIN sessions base ON base.rowid = sessions_fts.rowid
    WHERE sessions_fts MATCH ?
  `;
  const params: Array<string | number> = [matchQuery];

  if (filters?.language) {
    sql += ' AND base.language = ?';
    params.push(filters.language);
  }

  if (filters?.framework) {
    sql += ' AND base.framework = ?';
    params.push(filters.framework);
  }

  if (filters?.status) {
    sql += ' AND base.status = ?';
    params.push(filters.status);
  }

  sql += ' ORDER BY rank LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params) as FtsCandidateRow[];
}

export function searchSessions(
  params: Search,
  store: Store,
  db: Database.Database
): SearchResult[] {
  const ftsLimit = Math.min(params.limit * 20, 200);

  try {
    const candidateRows = queryFtsCandidates(params.query, ftsLimit, db, {
      language: params.language,
      framework: params.framework,
      status: params.status
    });

    if (candidateRows.length === 0) {
      return fuseOnlySearch(params, store);
    }

    const orderedIds = candidateRows.map((row) => row.session_id);
    const candidates = store.getSessionsByIds(orderedIds);

    return rerankCandidates(params.query, candidates, params.limit).map(
      (result) => ({
        ...result.item,
        _score: result.score
      })
    );
  } catch {
    return fuseOnlySearch(params, store);
  }
}

function fuseOnlySimilar(
  errorMessage: string,
  store: Store,
  limit: number
): Array<{ session: Session; similarity: number }> {
  const threshold = getFuzzyThreshold();
  const sessions = store.listSessions({ limit: 500, offset: 0 });
  const withErrors = sessions.filter((session) =>
    Boolean(session.error_message)
  );

  if (withErrors.length === 0) {
    return [];
  }

  const fuse = new Fuse(withErrors, {
    keys: [
      { name: 'error_message', weight: 0.7 },
      { name: 'error_type', weight: 0.3 }
    ],
    threshold,
    includeScore: true
  });

  return fuse.search(errorMessage, { limit }).map((result) => ({
    session: result.item,
    similarity: Math.round((1 - (result.score ?? 0)) * 100)
  }));
}

export function findSimilarErrors(
  errorMessage: string,
  store: Store,
  db: Database.Database,
  limit = 5
): Array<{ session: Session; similarity: number }> {
  const threshold = getFuzzyThreshold();
  const ftsLimit = Math.min(limit * 20, 100);

  try {
    const candidateRows = queryFtsCandidates(errorMessage, ftsLimit, db);

    if (candidateRows.length === 0) {
      return fuseOnlySimilar(errorMessage, store, limit);
    }

    const orderedIds = candidateRows.map((row) => row.session_id);
    const candidates = store
      .getSessionsByIds(orderedIds)
      .filter((session) => Boolean(session.error_message));

    if (candidates.length === 0) {
      return [];
    }

    const fuse = new Fuse(candidates, {
      keys: [
        { name: 'error_message', weight: 0.7 },
        { name: 'error_type', weight: 0.3 }
      ],
      threshold,
      includeScore: true
    });

    const reranked = fuse.search(errorMessage, { limit });

    if (reranked.length > 0) {
      return reranked.map((result) => ({
        session: result.item,
        similarity: Math.round((1 - (result.score ?? 0)) * 100)
      }));
    }

    return candidates.slice(0, limit).map((candidate) => ({
      session: candidate,
      similarity: 100
    }));
  } catch {
    return fuseOnlySimilar(errorMessage, store, limit);
  }
}
