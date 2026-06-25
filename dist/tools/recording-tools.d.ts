import type { Store } from '../store.js';
import { type ToolHandler } from './common.js';
export declare function createRecordingToolHandlers(store: Store): {
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
};
//# sourceMappingURL=recording-tools.d.ts.map