import type Database from 'better-sqlite3';
import type { Store } from '../store.js';
import { type ToolHandler } from './common.js';
export declare function createSearchToolHandlers(store: Store, db: Database.Database): {
    handleSearchSessions: ToolHandler<{
        query: string;
        limit: number;
        offset: number;
        include_related: boolean;
        markdown: boolean;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleFindSimilarErrors: ToolHandler<{
        error_message: string;
        limit: number;
    }>;
    handleSaveSearchPreset: ToolHandler<{
        name: string;
        query: string;
        limit: number;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleListSearchPresets: ToolHandler<{}>;
    handleDeleteSearchPreset: ToolHandler<{
        name: string;
    }>;
};
//# sourceMappingURL=search-tools.d.ts.map