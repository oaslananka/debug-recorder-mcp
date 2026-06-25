export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogMetadata = Record<string, unknown>;
export declare function redactSecrets(value: unknown): unknown;
export declare function redact(value: unknown): unknown;
export declare function log(level: LogLevel, message: string, metadata?: LogMetadata): void;
//# sourceMappingURL=logging.d.ts.map