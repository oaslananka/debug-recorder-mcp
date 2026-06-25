import type { Store } from '../store.js';
import { type ToolHandler } from './common.js';
export declare function createAdminToolHandlers(store: Store): {
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
};
//# sourceMappingURL=admin-tools.d.ts.map