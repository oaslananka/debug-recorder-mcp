import type Database from 'better-sqlite3';
import { type AddFix, type CloseSession, type CreateSession, type ExportPayload, type ImportResult, type SavedSearchPreset, type SaveSearchPreset, type ListSessions, type RecordCommand, type Session, type UpdateSession } from './types.js';
/** Filters and pagination controls for listing recorded debug sessions. */
export type SessionListOptions = {
    status?: ListSessions['status'];
    language?: string;
    framework?: string;
    limit: number;
    offset: number;
};
export declare class SessionNotFoundError extends Error {
    readonly sessionId: string;
    readonly code = "SESSION_NOT_FOUND";
    constructor(sessionId: string);
}
export declare class Store {
    private readonly db;
    constructor(db: Database.Database);
    static create(dbPath?: string): Store;
    close(): void;
    private ensureSessionExists;
    saveSearchPreset(data: SaveSearchPreset): SavedSearchPreset;
    listSearchPresets(): SavedSearchPreset[];
    removeSearchPreset(name: string): boolean;
    private getSearchPresetOrThrow;
    createSession(data: CreateSession): Session;
    getSession(id: string): Session | null;
    getSessionsByIds(ids: string[]): Session[];
    private getSessionOrThrow;
    updateSession(id: string, data: Pick<UpdateSession, 'title' | 'description' | 'tags'>): Session | null;
    deleteSession(id: string): boolean;
    listSessions(options: SessionListOptions): Session[];
    addFix(data: AddFix): {
        id: string;
    };
    recordCommand(data: RecordCommand): {
        id: string;
    };
    closeSession(data: CloseSession): Session | null;
    getStats(): {
        total: number;
        resolved: number;
        open: number;
        abandoned: number;
        byLanguage: Array<{
            language: string;
            count: number;
        }>;
        topErrorTypes: Array<{
            error_type: string;
            count: number;
        }>;
        resolutionRate: number;
    };
    exportAll(): ExportPayload;
    importAll(payload: unknown, options?: {
        skipExisting?: boolean;
    }): ImportResult;
    private getStatusCount;
}
//# sourceMappingURL=store.d.ts.map