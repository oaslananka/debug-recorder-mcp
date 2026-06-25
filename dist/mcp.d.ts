#!/usr/bin/env node
import type Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Store } from './store.js';
import { type ToolHandler } from './tools/common.js';
export type DebugRecorderRuntime = {
    db: Database.Database;
    store: Store;
    dbPath?: string;
};
export declare function isClosedDatabaseError(error: unknown): boolean;
export declare function safeHandler<T>(toolName: string, handler: ToolHandler<T>): ToolHandler<T>;
export declare function createRuntime(dbPath?: string): DebugRecorderRuntime;
export declare function closeRuntime(runtime: DebugRecorderRuntime): void;
export declare function createToolHandlers(runtime: DebugRecorderRuntime): {
    handleGetStats: ToolHandler<{}>;
    handleGetDiagnostics: ToolHandler<{}>;
    handleExportSessions: ToolHandler<{
        format: "summary" | "json";
    }>;
    handleImportSessions: ToolHandler<{
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
    handleAddFix: ToolHandler<{
        description: string;
        session_id: string;
        worked: boolean;
        code_snippet?: string | undefined;
        notes?: string | undefined;
    }>;
    handleRecordCommand: ToolHandler<{
        session_id: string;
        command: string;
        output?: string | undefined;
        exit_code?: number | undefined;
    }>;
    handleCloseSession: ToolHandler<{
        status: "resolved" | "abandoned";
        session_id: string;
        summary?: string | undefined;
    }>;
    handleStartDebugSession: ToolHandler<{
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
    handleGetSession: ToolHandler<{
        session_id: string;
    }>;
    handleUpdateSession: ToolHandler<{
        session_id: string;
        description?: string | undefined;
        title?: string | undefined;
        tags?: string[] | undefined;
    }>;
    handleDeleteSession: ToolHandler<{
        session_id: string;
        confirm: boolean;
    }>;
    handleListSessions: ToolHandler<{
        limit: number;
        offset: number;
        status?: "open" | "resolved" | "abandoned" | undefined;
        language?: string | undefined;
        framework?: string | undefined;
    }>;
    handleGetSessionContext: ToolHandler<{
        session_id: string;
        include_commands: boolean;
        include_fixes: boolean;
    }>;
};
export declare function createDebugRecorderServer(runtime: DebugRecorderRuntime): McpServer;
export declare function startStdioServer(runtime?: DebugRecorderRuntime): Promise<void>;
//# sourceMappingURL=mcp.d.ts.map