import type Database from 'better-sqlite3';
import Fuse from 'fuse.js';
import type { Store } from './store.js';
import type { Search, Session } from './types.js';

export type SearchResult = Session & { _score: number | undefined };

export type SearchPagination = {
  limit: number;
  offset: number;
  returned: number;
  has_more: boolean;
  next_offset: number | null;
  truncated: boolean;
  window_limit: number | null;
};

export type RelatedSessionGroup = {
  reason: 'tag' | 'error_type' | 'language' | 'framework';
  value: string;
  session_ids: string[];
  count: number;
};

export type SearchPage = {
  count: number;
  results: SearchResult[];
  pagination: SearchPagination;
  related_groups: RelatedSessionGroup[];
  markdown?: string;
};

type FtsCandidateRow = {
  session_id: string;
  rank: number;
};

const DEFAULT_FUZZY_THRESHOLD = 0.5;
const MAX_SEARCH_WINDOW = 1_000;
const FALLBACK_SEARCH_WINDOW = 500;

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

type FallbackSearchWindow = {
  results: SearchResult[];
  truncated: boolean;
};

function fuseOnlySearchWindow(
  params: Search,
  store: Store
): FallbackSearchWindow {
  const threshold = getFuzzyThreshold();
  const sessionWindow = store.listSessions({
    status: params.status,
    language: params.language,
    framework: params.framework,
    limit: FALLBACK_SEARCH_WINDOW + 1,
    offset: 0
  });
  const truncated = sessionWindow.length > FALLBACK_SEARCH_WINDOW;
  const sessions = sessionWindow.slice(0, FALLBACK_SEARCH_WINDOW);

  if (sessions.length === 0) {
    return { results: [], truncated };
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

  return {
    results: fuse
      .search(params.query, { limit: FALLBACK_SEARCH_WINDOW })
      .map((result) => ({
        ...result.item,
        _score: result.score
      })),
    truncated
  };
}

function fuseOnlySearch(params: Search, store: Store): SearchResult[] {
  return fuseOnlySearchWindow(params, store).results.slice(0, params.limit);
}

function appendFtsFilters(
  sql: string,
  params: Array<string | number>,
  filters?: Pick<Search, 'language' | 'framework' | 'status'>
): string {
  let filteredSql = sql;

  if (filters?.language) {
    filteredSql += ' AND base.language = ?';
    params.push(filters.language);
  }

  if (filters?.framework) {
    filteredSql += ' AND base.framework = ?';
    params.push(filters.framework);
  }

  if (filters?.status) {
    filteredSql += ' AND base.status = ?';
    params.push(filters.status);
  }

  return filteredSql;
}

type FtsPageResult = {
  results: SearchResult[];
  total: number;
};

function queryFtsPage(
  params: Search,
  store: Store,
  db: Database.Database
): FtsPageResult | null {
  const matchQuery = buildMatchQuery(params.query);

  if (!matchQuery) {
    return null;
  }

  const filters = {
    language: params.language,
    framework: params.framework,
    status: params.status
  };
  const countParams: Array<string | number> = [matchQuery];
  const countSql = appendFtsFilters(
    `
      SELECT COUNT(*) as count
      FROM sessions_fts
      JOIN sessions base ON base.rowid = sessions_fts.rowid
      WHERE sessions_fts MATCH ?
    `,
    countParams,
    filters
  );
  const total = (db.prepare(countSql).get(...countParams) as { count: number })
    .count;

  if (total === 0 || (params.offset ?? 0) >= total) {
    return { results: [], total };
  }

  const pageParams: Array<string | number> = [matchQuery];
  let pageSql = appendFtsFilters(
    `
      SELECT base.id as session_id, bm25(sessions_fts) as rank
      FROM sessions_fts
      JOIN sessions base ON base.rowid = sessions_fts.rowid
      WHERE sessions_fts MATCH ?
    `,
    pageParams,
    filters
  );
  pageSql +=
    ' ORDER BY rank ASC, base.created_at DESC, base.id ASC LIMIT ? OFFSET ?';
  pageParams.push(params.limit, params.offset ?? 0);
  const rows = db.prepare(pageSql).all(...pageParams) as FtsCandidateRow[];
  const byId = new Map(
    store
      .getSessionsByIds(rows.map((row) => row.session_id))
      .map((session) => [session.id, session])
  );
  const results = rows.flatMap((row) => {
    const session = byId.get(row.session_id);
    return session ? [{ ...session, _score: row.rank }] : [];
  });

  return { results, total };
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

  sql = appendFtsFilters(sql, params, filters);
  sql += ' ORDER BY rank ASC, base.created_at DESC, base.id ASC LIMIT ?';
  params.push(limit);

  return db.prepare(sql).all(...params) as FtsCandidateRow[];
}

export function searchSessions(
  params: Search,
  store: Store,
  db: Database.Database
): SearchResult[] {
  const ftsLimit = Math.min(params.limit * 20, MAX_SEARCH_WINDOW);

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

function addRelatedGroup(
  groups: Map<string, RelatedSessionGroup>,
  reason: RelatedSessionGroup['reason'],
  value: string | null,
  sessionId: string
): void {
  if (!value) {
    return;
  }

  const key = `${reason}:${value}`;
  const group = groups.get(key) ?? {
    reason,
    value,
    session_ids: [],
    count: 0
  };

  if (!group.session_ids.includes(sessionId)) {
    group.session_ids.push(sessionId);
    group.count = group.session_ids.length;
  }

  groups.set(key, group);
}

export function buildRelatedSessionGroups(
  results: SearchResult[]
): RelatedSessionGroup[] {
  const groups = new Map<string, RelatedSessionGroup>();

  for (const result of results) {
    for (const tag of result.tags) {
      addRelatedGroup(groups, 'tag', tag, result.id);
    }

    addRelatedGroup(groups, 'error_type', result.error_type, result.id);
    addRelatedGroup(groups, 'language', result.language, result.id);
    addRelatedGroup(groups, 'framework', result.framework, result.id);
  }

  return [...groups.values()]
    .filter((group) => group.count > 1)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return `${left.reason}:${left.value}`.localeCompare(
        `${right.reason}:${right.value}`
      );
    })
    .slice(0, 10);
}

function formatResultLine(result: SearchResult, index: number): string {
  const details = [
    result.status,
    result.language,
    result.framework,
    result.error_type
  ].filter(Boolean);
  const score =
    result._score === undefined ? '' : ` score=${result._score.toFixed(3)}`;

  return `${index + 1}. **${result.title}** (${result.id}) — ${details.join(' / ') || 'no metadata'}${score}`;
}

export function formatSearchMarkdown(
  params: Search,
  results: SearchResult[],
  relatedGroups: RelatedSessionGroup[],
  pagination: SearchPagination
): string {
  const lines = [
    '# Debug Search Export',
    '',
    `- Query: ${params.query}`,
    `- Returned: ${pagination.returned}`,
    `- Offset: ${pagination.offset}`,
    `- Has more: ${pagination.has_more ? 'yes' : 'no'}`,
    '',
    '## Results',
    ''
  ];

  if (results.length === 0) {
    lines.push('No matching debug sessions found.');
  } else {
    lines.push(
      ...results.map((result, index) => formatResultLine(result, index))
    );
  }

  if (relatedGroups.length > 0) {
    lines.push('', '## Related session groups', '');
    for (const group of relatedGroups) {
      lines.push(
        `- ${group.reason}: ${group.value} — ${group.count} sessions (${group.session_ids.join(', ')})`
      );
    }
  }

  lines.push('', '## Postmortem prompts', '');
  lines.push('- What was the common failure mode?');
  lines.push('- Which fix attempts failed before the working fix?');
  lines.push('- Which guardrail would have detected this earlier?');

  return lines.join('\n');
}

export function searchSessionsPage(
  params: Search,
  store: Store,
  db: Database.Database
): SearchPage {
  const offset = params.offset ?? 0;
  const limit = params.limit;
  let results: SearchResult[];
  let hasMore: boolean;
  let truncated = false;
  let windowLimit: number | null = null;

  try {
    const ftsPage = queryFtsPage(params, store, db);

    if (ftsPage && ftsPage.total > 0) {
      results = ftsPage.results;
      hasMore = offset + results.length < ftsPage.total;
    } else {
      const fallback = fuseOnlySearchWindow(params, store);
      results = fallback.results.slice(offset, offset + limit);
      hasMore = fallback.results.length > offset + limit;
      truncated = fallback.truncated;
      windowLimit = FALLBACK_SEARCH_WINDOW;
    }
  } catch {
    const fallback = fuseOnlySearchWindow(params, store);
    results = fallback.results.slice(offset, offset + limit);
    hasMore = fallback.results.length > offset + limit;
    truncated = fallback.truncated;
    windowLimit = FALLBACK_SEARCH_WINDOW;
  }

  const pagination: SearchPagination = {
    limit,
    offset,
    returned: results.length,
    has_more: hasMore,
    next_offset: hasMore ? offset + results.length : null,
    truncated,
    window_limit: windowLimit
  };
  const relatedGroups = params.include_related
    ? buildRelatedSessionGroups(results)
    : [];

  return {
    count: results.length,
    results,
    pagination,
    related_groups: relatedGroups,
    ...(params.markdown
      ? {
          markdown: formatSearchMarkdown(
            params,
            results,
            relatedGroups,
            pagination
          )
        }
      : {})
  };
}
