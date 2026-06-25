import type Database from 'better-sqlite3';
import type { Store } from './store.js';
import type { Search, Session } from './types.js';
export type SearchResult = Session & {
    _score: number | undefined;
};
export type SearchPagination = {
    limit: number;
    offset: number;
    returned: number;
    has_more: boolean;
    next_offset: number | null;
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
export declare function searchSessions(params: Search, store: Store, db: Database.Database): SearchResult[];
export declare function findSimilarErrors(errorMessage: string, store: Store, db: Database.Database, limit?: number): Array<{
    session: Session;
    similarity: number;
}>;
export declare function buildRelatedSessionGroups(results: SearchResult[]): RelatedSessionGroup[];
export declare function formatSearchMarkdown(params: Search, results: SearchResult[], relatedGroups: RelatedSessionGroup[], pagination: SearchPagination): string;
export declare function searchSessionsPage(params: Search, store: Store, db: Database.Database): SearchPage;
//# sourceMappingURL=search.d.ts.map