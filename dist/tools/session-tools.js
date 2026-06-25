import { jsonContent } from './common.js';
export function createSessionToolHandlers(store) {
    const handleStartDebugSession = (input) => {
        const session = store.createSession(input);
        return jsonContent({
            success: true,
            session_id: session.id,
            message: `Debug session started: ${input.title}`
        });
    };
    const handleGetSession = (input) => {
        const session = store.getSession(input.session_id);
        if (!session) {
            throw new Error(`Session not found: ${input.session_id}`);
        }
        return jsonContent(session);
    };
    const handleUpdateSession = (input) => {
        const session = store.updateSession(input.session_id, {
            title: input.title,
            description: input.description,
            tags: input.tags
        });
        if (!session) {
            throw new Error(`Session not found: ${input.session_id}`);
        }
        return jsonContent({ success: true, session });
    };
    const handleDeleteSession = (input) => {
        if (!input.confirm) {
            return jsonContent({
                success: false,
                message: 'Set confirm: true to permanently delete the session'
            });
        }
        const deleted = store.deleteSession(input.session_id);
        return jsonContent({ success: deleted, session_id: input.session_id });
    };
    const handleListSessions = (input) => {
        const sessions = store.listSessions(input);
        return jsonContent({ count: sessions.length, sessions });
    };
    const handleGetSessionContext = (input) => {
        const session = store.getSession(input.session_id);
        if (!session) {
            throw new Error(`Session not found: ${input.session_id}`);
        }
        return jsonContent({
            problem: {
                title: session.title,
                error_message: session.error_message,
                error_type: session.error_type,
                language: session.language,
                framework: session.framework,
                environment: session.environment,
                description: session.description
            },
            status: session.status,
            duration_ms: Date.now() - session.created_at,
            fixes_tried: input.include_fixes ? session.fixes.length : undefined,
            working_fix: input.include_fixes
                ? (session.fixes.find((fix) => fix.worked) ?? null)
                : undefined,
            failed_fixes: input.include_fixes
                ? session.fixes
                    .filter((fix) => !fix.worked)
                    .map((fix) => fix.description)
                : undefined,
            commands: input.include_commands ? session.commands.slice(-10) : undefined
        });
    };
    return {
        handleStartDebugSession,
        handleGetSession,
        handleUpdateSession,
        handleDeleteSession,
        handleListSessions,
        handleGetSessionContext
    };
}
//# sourceMappingURL=session-tools.js.map