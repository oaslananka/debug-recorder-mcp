import type { Store } from '../store.js';
import { type ToolHandler } from './common.js';
export declare function createSessionToolHandlers(store: Store): {
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
//# sourceMappingURL=session-tools.d.ts.map