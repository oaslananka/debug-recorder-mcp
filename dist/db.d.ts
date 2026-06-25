import Database from 'better-sqlite3';
export declare const CURRENT_SCHEMA_VERSION: number;
export declare function getDbPath(): string;
export declare function openDb(dbPath?: string): Database.Database;
export declare function createTestDb(): Database.Database;
//# sourceMappingURL=db.d.ts.map