#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import type Database from 'better-sqlite3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getDbPath, openDb } from './db.js';
import { log } from './logging.js';
import { Store } from './store.js';
import { type ToolHandler } from './tools/common.js';
import { createSplitToolHandlers } from './tools/index.js';
import {
  AddFixSchema,
  CloseSessionSchema,
  CreateSessionSchema,
  DeleteSessionSchema,
  ExportSessionsSchema,
  FindSimilarErrorsSchema,
  GetSessionContextSchema,
  GetSessionSchema,
  GetStatsSchema,
  ImportSessionsSchema,
  ListSessionsSchema,
  RecordCommandSchema,
  SearchSchema,
  UpdateSessionSchema
} from './types.js';
import { getVersion } from './version.js';

export type DebugRecorderRuntime = {
  db: Database.Database;
  store: Store;
  dbPath?: string;
};

export function isClosedDatabaseError(error: unknown): boolean {
  return error instanceof Error && /closed/i.test(error.message);
}

export function safeHandler<T>(
  toolName: string,
  handler: ToolHandler<T>
): ToolHandler<T> {
  return (input: T) => {
    try {
      return handler(input);
    } catch (error) {
      log('error', 'Tool handler error', {
        tool: toolName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  };
}

export function createRuntime(dbPath?: string): DebugRecorderRuntime {
  const resolvedPath = dbPath ?? getDbPath();
  const db = openDb(resolvedPath);
  return {
    db,
    store: new Store(db),
    dbPath: resolvedPath
  };
}

export function closeRuntime(runtime: DebugRecorderRuntime): void {
  try {
    runtime.db.close();
  } catch (error) {
    if (!isClosedDatabaseError(error)) {
      throw error;
    }
  }
}

export function createToolHandlers(runtime: DebugRecorderRuntime) {
  return createSplitToolHandlers(runtime.store, runtime.db);
}

export function createDebugRecorderServer(
  runtime: DebugRecorderRuntime
): McpServer {
  const server = new McpServer(
    { name: 'mcp-debug-recorder', version: getVersion() },
    { capabilities: { logging: {} } }
  );
  const handlers = createToolHandlers(runtime);

  const registrations = [
    {
      name: 'start_debug_session',
      title: 'Start Debug Session',
      description: 'Start recording a new debug session for a bug or error',
      inputSchema: CreateSessionSchema,
      handler: 'handleStartDebugSession',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'add_fix',
      title: 'Add Fix Attempt',
      description:
        'Record a fix attempt for a debug session. If it worked, session is marked resolved.',
      inputSchema: AddFixSchema,
      handler: 'handleAddFix',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'record_command',
      title: 'Record Command',
      description:
        'Record a terminal command and its output during a debug session',
      inputSchema: RecordCommandSchema,
      handler: 'handleRecordCommand',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'close_session',
      title: 'Close Debug Session',
      description: 'Mark a debug session as resolved or abandoned',
      inputSchema: CloseSessionSchema,
      handler: 'handleCloseSession',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'search_sessions',
      title: 'Search Debug Sessions',
      description:
        'Search past debug sessions by error message, keyword, or description',
      inputSchema: SearchSchema,
      handler: 'handleSearchSessions',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'find_similar_errors',
      title: 'Find Similar Errors',
      description:
        'Find past sessions with similar error messages — answers "have I seen this before?"',
      inputSchema: FindSimilarErrorsSchema,
      handler: 'handleFindSimilarErrors',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'get_session',
      title: 'Get Session Details',
      description:
        'Get full details of a debug session including all fixes and commands',
      inputSchema: GetSessionSchema,
      handler: 'handleGetSession',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'update_session',
      title: 'Update Session',
      description:
        'Update title, description, or tags of an existing debug session',
      inputSchema: UpdateSessionSchema,
      handler: 'handleUpdateSession',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'delete_session',
      title: 'Delete Debug Session',
      description:
        'Permanently delete a debug session and all related fixes and commands',
      inputSchema: DeleteSessionSchema,
      handler: 'handleDeleteSession',
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        openWorldHint: false
      }
    },
    {
      name: 'list_sessions',
      title: 'List Debug Sessions',
      description: 'List debug sessions with optional filters',
      inputSchema: ListSessionsSchema,
      handler: 'handleListSessions',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'get_stats',
      title: 'Get Debug Statistics',
      description: 'Get statistics about your debug history',
      inputSchema: GetStatsSchema,
      handler: 'handleGetStats',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'export_sessions',
      title: 'Export Debug Sessions',
      description: 'Export all debug sessions for backup or migration',
      inputSchema: ExportSessionsSchema,
      handler: 'handleExportSessions',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'import_sessions',
      title: 'Import Debug Sessions',
      description:
        'Import sessions previously exported from mcp-debug-recorder',
      inputSchema: ImportSessionsSchema,
      handler: 'handleImportSessions',
      annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        openWorldHint: false
      }
    },
    {
      name: 'get_session_context',
      title: 'Get Session Context',
      description:
        'Get a structured summary of a debug session formatted for AI context',
      inputSchema: GetSessionContextSchema,
      handler: 'handleGetSessionContext',
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        openWorldHint: false
      }
    }
  ] as const;

  for (const registration of registrations) {
    const handler = handlers[registration.handler] as ToolHandler<unknown>;
    server.registerTool(
      registration.name,
      {
        title: registration.title,
        description: registration.description,
        inputSchema: registration.inputSchema,
        annotations: registration.annotations
      },
      safeHandler(registration.name, handler)
    );
  }

  return server;
}

/* istanbul ignore next */
export async function startStdioServer(
  runtime?: DebugRecorderRuntime
): Promise<void> {
  const ownedRuntime = runtime ?? createRuntime();
  const server = createDebugRecorderServer(ownedRuntime);
  const transport = new StdioServerTransport();
  let shuttingDown = false;

  const shutdown = (reason: string, exitCode: number): void => {
    if (shuttingDown) {
      return;
    }

    shuttingDown = true;

    log('info', 'Shutting down stdio server', {
      reason,
      db_path: ownedRuntime.dbPath ?? getDbPath()
    });

    try {
      closeRuntime(ownedRuntime);
    } finally {
      process.exit(exitCode);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('uncaughtException', (error) => {
    log('error', 'Uncaught exception', {
      error: error instanceof Error ? error.message : String(error)
    });
    shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    log('error', 'Unhandled rejection', {
      reason: reason instanceof Error ? reason.message : String(reason)
    });
    shutdown('unhandledRejection', 1);
  });

  try {
    await server.connect(transport);
    log('info', 'mcp-debug-recorder stdio server started', {
      db_path: ownedRuntime.dbPath ?? getDbPath()
    });
  } catch (error) {
    closeRuntime(ownedRuntime);
    throw error;
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

/* istanbul ignore next */
if (isMainModule) {
  startStdioServer().catch((error: unknown) => {
    log('error', 'Failed to start stdio server', {
      error: error instanceof Error ? error.message : String(error)
    });
    process.exitCode = 1;
  });
}
