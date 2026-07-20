import type { AddFix, CloseSession, RecordCommand } from '../types.js';
import { SessionNotFoundError, type Store } from '../store.js';
import { jsonContent, type ToolHandler } from './common.js';

export function createRecordingToolHandlers(store: Store) {
  const handleAddFix: ToolHandler<AddFix> = (input) => {
    const result = store.addFix(input);
    return jsonContent({
      success: true,
      fix_id: result.id,
      resolved: input.worked
    });
  };

  const handleRecordCommand: ToolHandler<RecordCommand> = (input) => {
    const result = store.recordCommand(input);
    return jsonContent({ success: true, command_id: result.id });
  };

  const handleCloseSession: ToolHandler<CloseSession> = (input) => {
    const session = store.closeSession(input);

    if (!session) {
      throw new SessionNotFoundError(input.session_id);
    }

    return jsonContent({ success: true, session });
  };

  return {
    handleAddFix,
    handleRecordCommand,
    handleCloseSession
  };
}
