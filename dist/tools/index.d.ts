import type Database from 'better-sqlite3';
import type { Store } from '../store.js';
export declare function createSplitToolHandlers(store: Store, db: Database.Database): {
    handleGetStats: import("./common.js").ToolHandler<{}>;
    handleGetDiagnostics: import("./common.js").ToolHandler<{}>;
    handleExportSessions: import("./common.js").ToolHandler<{
        format: "summary" | "json";
    }>;
    handleImportSessions: import("./common.js").ToolHandler<{
        payload: {
            schema_version: number;
            sessions: {
                description: string | null;
                status: "open" | "resolved" | "abandoned";
                id: string;
                title: string;
                error_message: string | null;
                error_type: string | null;
                stack_trace: string | null;
                environment: string | null;
                language: string | null;
                framework: string | null;
                tags: string;
                created_at: number;
                updated_at: number;
            }[];
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: number;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
            exported_at?: string | undefined;
        };
        skip_existing: boolean;
    }>;
    handleSearchSessions: import("./common.js").ToolHandler<{
        query: string;
        limit: number;
        offset: number;
        include_related: boolean;
        markdown: boolean;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleFindSimilarErrors: import("./common.js").ToolHandler<{
        error_message: string;
        limit: number;
    }>;
    handleSaveSearchPreset: import("./common.js").ToolHandler<{
        name: string;
        query: string;
        limit: number;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleListSearchPresets: import("./common.js").ToolHandler<{}>;
    handleDeleteSearchPreset: import("./common.js").ToolHandler<{
        name: string;
    }>;
    handleAddFix: import("./common.js").ToolHandler<{
        description: string;
        session_id: string;
        worked: boolean;
        code_snippet?: string | undefined;
        notes?: string | undefined;
    }>;
    handleRecordCommand: import("./common.js").ToolHandler<{
        session_id: string;
        command: string;
        output?: string | undefined;
        exit_code?: number | undefined;
    }>;
    handleCloseSession: import("./common.js").ToolHandler<{
        status: "resolved" | "abandoned";
        session_id: string;
        summary?: string | undefined;
    }>;
    handleStartDebugSession: import("./common.js").ToolHandler<{
        title: string;
        tags: string[];
        description?: string | undefined;
        error_message?: string | undefined;
        error_type?: string | undefined;
        stack_trace?: string | undefined;
        environment?: string | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleGetSession: import("./common.js").ToolHandler<{
        session_id: string;
    }>;
    handleUpdateSession: import("./common.js").ToolHandler<{
        session_id: string;
        description?: string | undefined;
        title?: string | undefined;
        tags?: string[] | undefined;
    }>;
    handleDeleteSession: import("./common.js").ToolHandler<{
        session_id: string;
        confirm: boolean;
    }>;
    handleListSessions: import("./common.js").ToolHandler<{
        limit: number;
        offset: number;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleGetSessionContext: import("./common.js").ToolHandler<{
        session_id: string;
        include_commands: boolean;
        include_fixes: boolean;
    }>;
};
//# sourceMappingURL=index.d.ts.map