import { type Server as HttpServer } from 'node:http';
import { type DebugRecorderRuntime } from './mcp.js';
export type HttpServerOptions = {
    host?: string;
    port?: number;
    remoteHttp?: boolean;
    token?: string;
    allowedHosts?: string[];
    allowedOrigins?: string[];
    maxBodyBytes?: number;
};
export type HttpServerConfig = {
    host: string;
    port: number;
    remoteHttp: boolean;
    token?: string;
    allowedHosts: Set<string>;
    allowedOrigins: Set<string>;
    maxBodyBytes: number;
};
export declare function resolveHttpConfig(options?: HttpServerOptions): HttpServerConfig;
export declare function createHttpServer(runtime: DebugRecorderRuntime, options?: HttpServerOptions): {
    server: HttpServer;
    config: HttpServerConfig;
};
export declare function startHttpServer(runtime?: DebugRecorderRuntime, options?: HttpServerOptions): Promise<void>;
//# sourceMappingURL=server-http.d.ts.map