import { recordDiagnosticEvent } from '../diagnostics.js';
import { findSimilarErrors, searchSessionsPage } from '../search.js';
import { jsonContent } from './common.js';
export function createSearchToolHandlers(store, db) {
    const handleSearchSessions = (input) => {
        recordDiagnosticEvent('search');
        return jsonContent(searchSessionsPage(input, store, db));
    };
    const handleFindSimilarErrors = (input) => {
        const results = findSimilarErrors(input.error_message, store, db, input.limit);
        return jsonContent({
            found: results.length,
            message: results.length > 0
                ? `Found ${results.length} similar past errors`
                : 'No similar errors found in history',
            results
        });
    };
    const handleSaveSearchPreset = (input) => jsonContent({ success: true, preset: store.saveSearchPreset(input) });
    const handleListSearchPresets = () => {
        const presets = store.listSearchPresets();
        return jsonContent({ count: presets.length, presets });
    };
    const handleDeleteSearchPreset = (input) => jsonContent({
        success: true,
        name: input.name,
        deleted: store.removeSearchPreset(input.name)
    });
    return {
        handleSearchSessions,
        handleFindSimilarErrors,
        handleSaveSearchPreset,
        handleListSearchPresets,
        handleDeleteSearchPreset
    };
}
//# sourceMappingURL=search-tools.js.map