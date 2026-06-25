import { createAdminToolHandlers } from './admin-tools.js';
import { createRecordingToolHandlers } from './recording-tools.js';
import { createSearchToolHandlers } from './search-tools.js';
import { createSessionToolHandlers } from './session-tools.js';
export function createSplitToolHandlers(store, db) {
    return {
        ...createSessionToolHandlers(store),
        ...createRecordingToolHandlers(store),
        ...createSearchToolHandlers(store, db),
        ...createAdminToolHandlers(store)
    };
}
//# sourceMappingURL=index.js.map