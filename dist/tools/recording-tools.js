import { jsonContent } from './common.js';
export function createRecordingToolHandlers(store) {
    const handleAddFix = (input) => {
        const result = store.addFix(input);
        return jsonContent({
            success: true,
            fix_id: result.id,
            resolved: input.worked
        });
    };
    const handleRecordCommand = (input) => {
        const result = store.recordCommand(input);
        return jsonContent({ success: true, command_id: result.id });
    };
    const handleCloseSession = (input) => {
        const session = store.closeSession(input);
        if (!session) {
            throw new Error(`Session not found: ${input.session_id}`);
        }
        return jsonContent({ success: true, session });
    };
    return {
        handleAddFix,
        handleRecordCommand,
        handleCloseSession
    };
}
//# sourceMappingURL=recording-tools.js.map