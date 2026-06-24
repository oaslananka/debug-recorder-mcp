#!/usr/bin/env node
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Database = require('better-sqlite3');

function defaultDbPath() {
  return join(homedir(), '.debug-recorder-mcp', 'sessions.db');
}

function parseArgs(argv) {
  const result = { dbPath: process.env.DEBUG_RECORDER_DB ?? defaultDbPath() };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }

    if (arg === '--dry-run') {
      result.dryRun = true;
      continue;
    }

    if (arg === '--db') {
      const value = argv[index + 1];
      if (!value) {
        throw new Error('--db requires a path');
      }
      result.dbPath = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--db=')) {
      result.dbPath = arg.slice('--db='.length);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return result;
}

function printHelp() {
  console.log(`Usage: node scripts/compact-sqlite.mjs [--db <path>] [--dry-run]

Runs safe SQLite maintenance for a debug-recorder-mcp database:

  1. PRAGMA optimize
  2. PRAGMA wal_checkpoint(TRUNCATE)
  3. VACUUM unless --dry-run is set

The database path defaults to DEBUG_RECORDER_DB or ~/.debug-recorder-mcp/sessions.db.`);
}

function readMetrics(db) {
  const pageSize = db.pragma('page_size', { simple: true });
  const pageCount = db.pragma('page_count', { simple: true });
  const freelistCount = db.pragma('freelist_count', { simple: true });

  return {
    pageSize,
    pageCount,
    freelistCount,
    estimatedBytes: pageSize * pageCount,
    reclaimableBytes: pageSize * freelistCount
  };
}

function run() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const dbPath = resolve(options.dbPath);

  if (!existsSync(dbPath)) {
    throw new Error(`Database file does not exist: ${dbPath}`);
  }

  const db = new Database(dbPath);

  try {
    const before = readMetrics(db);
    db.pragma('optimize');
    db.pragma('wal_checkpoint(TRUNCATE)');

    if (!options.dryRun) {
      db.exec('VACUUM');
    }

    const after = readMetrics(db);
    console.log(
      JSON.stringify(
        {
          database: dbPath,
          dryRun: options.dryRun === true,
          before,
          after
        },
        null,
        2
      )
    );
  } finally {
    db.close();
  }
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
