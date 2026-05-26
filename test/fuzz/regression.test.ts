import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import * as fc from 'fast-check';
import type { Arbitrary } from 'fast-check';
import { CURRENT_SCHEMA_VERSION, createTestDb } from '../../src/db.js';
import { redact } from '../../src/logging.js';
import { searchSessions } from '../../src/search.js';
import { resolveHttpConfig } from '../../src/server-http.js';
import { Store } from '../../src/store.js';
import {
  ExportPayloadSchema,
  type CommandRow,
  type ExportPayload,
  type FixRow,
  type SessionRow
} from '../../src/types.js';

const PROPERTY_RUNS = 60;
const PROPERTY_SEED = 20_260_526;
const PROPERTY_CONFIG = {
  numRuns: PROPERTY_RUNS,
  seed: PROPERTY_SEED
};
const originalLogLevel = process.env.LOG_LEVEL;
const TOKEN_CHARACTERS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._-'.split(
    ''
  ) as [string, ...string[]];

function tokenText(minLength = 20, maxLength = 64): Arbitrary<string> {
  return fc
    .array(fc.constantFrom(...TOKEN_CHARACTERS), { minLength, maxLength })
    .map((characters) => characters.join(''));
}

function nullableText(maxLength: number): Arbitrary<string | null> {
  return fc.oneof(fc.constant(null), fc.string({ maxLength }));
}

const timestampArbitrary = fc.integer({
  min: 0,
  max: 4_102_444_800_000
});
const tagJsonArbitrary = fc
  .array(fc.string({ minLength: 1, maxLength: 24 }), { maxLength: 8 })
  .map((tags) => JSON.stringify(tags));

const sessionRowArbitrary: Arbitrary<SessionRow> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  description: nullableText(200),
  error_message: nullableText(200),
  error_type: nullableText(80),
  stack_trace: nullableText(400),
  environment: nullableText(120),
  language: nullableText(40),
  framework: nullableText(40),
  tags: tagJsonArbitrary,
  status: fc.constantFrom('open', 'resolved', 'abandoned'),
  created_at: timestampArbitrary,
  updated_at: timestampArbitrary
});

const fixRowArbitrary: Arbitrary<FixRow> = fc.record({
  id: fc.uuid(),
  session_id: fc.uuid(),
  description: fc.string({ minLength: 1, maxLength: 160 }),
  code_snippet: nullableText(240),
  worked: fc.constantFrom(0, 1),
  notes: nullableText(160),
  created_at: timestampArbitrary
});

const commandRowArbitrary: Arbitrary<CommandRow> = fc.record({
  id: fc.uuid(),
  session_id: fc.uuid(),
  command: fc.string({ minLength: 1, maxLength: 120 }),
  output: nullableText(240),
  exit_code: fc.oneof(fc.constant(null), fc.integer({ min: -1, max: 255 })),
  ran_at: timestampArbitrary
});

const exportPayloadArbitrary: Arbitrary<ExportPayload> = fc.record({
  schema_version: fc.constant(CURRENT_SCHEMA_VERSION),
  sessions: fc.array(sessionRowArbitrary, { maxLength: 4 }),
  fixes: fc.array(fixRowArbitrary, { maxLength: 4 }),
  commands: fc.array(commandRowArbitrary, { maxLength: 4 })
});

beforeAll(() => {
  process.env.LOG_LEVEL = 'warn';
});

afterAll(() => {
  if (originalLogLevel === undefined) {
    delete process.env.LOG_LEVEL;
    return;
  }

  process.env.LOG_LEVEL = originalLogLevel;
});

describe('property regression gates', () => {
  it('redacts generated secret-bearing values recursively', () => {
    fc.assert(
      fc.property(tokenText(), (secret) => {
        const result = redact({
          command: `curl -H authorization=Bearer ${secret}`,
          env: [`api_key=${secret}`, { nestedToken: secret }]
        });
        const serialized = JSON.stringify(result);

        expect(serialized).not.toContain(secret);
        expect(serialized).toContain('[REDACTED]');
      }),
      PROPERTY_CONFIG
    );
  });

  it('imports generated valid export payloads without losing count accounting', () => {
    fc.assert(
      fc.property(exportPayloadArbitrary, (payload) => {
        const parsed = ExportPayloadSchema.safeParse(payload);
        const db = createTestDb();
        const store = new Store(db);

        try {
          expect(parsed.success).toBe(true);

          const result = store.importAll(payload);
          const sessionCount =
            result.imported.sessions +
            result.skipped.sessions +
            result.invalid.sessions;
          const fixCount =
            result.imported.fixes + result.skipped.fixes + result.invalid.fixes;
          const commandCount =
            result.imported.commands +
            result.skipped.commands +
            result.invalid.commands;

          expect(sessionCount).toBe(payload.sessions.length);
          expect(fixCount).toBe(payload.fixes.length);
          expect(commandCount).toBe(payload.commands.length);
        } finally {
          db.close();
        }
      }),
      PROPERTY_CONFIG
    );
  });

  it('keeps search stable for generated FTS punctuation and Unicode queries', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 80 }), (query) => {
        const db = createTestDb();
        const store = new Store(db);

        try {
          store.createSession({
            title: 'Generated parser failure',
            description: 'Parser cannot read generated payload',
            error_message: 'TypeError while parsing generated payload',
            tags: ['generated', 'parser']
          });

          const results = searchSessions({ query, limit: 5 }, store, db);

          expect(results.length).toBeLessThanOrEqual(5);
        } finally {
          db.close();
        }
      }),
      PROPERTY_CONFIG
    );
  });

  it('normalizes generated HTTP allowlists and rejects wildcard remote origins', () => {
    fc.assert(
      fc.property(
        tokenText(1, 16),
        fc.integer({ min: 1, max: 65_535 }),
        (hostLabel, port) => {
          const hostname = `${hostLabel.toLowerCase()}.example.test`;
          const config = resolveHttpConfig({
            host: '0.0.0.0',
            port,
            remoteHttp: true,
            token: 'local-test-token',
            allowedHosts: [`${hostname.toUpperCase()}:${port}.`],
            allowedOrigins: [`HTTPS://${hostname.toUpperCase()}:${port}/`]
          });

          expect(config.allowedHosts.has(`${hostname}:${port}`)).toBe(true);
          expect(config.allowedOrigins.has(`https://${hostname}:${port}`)).toBe(
            true
          );
          expect(() =>
            resolveHttpConfig({
              host: '0.0.0.0',
              port,
              remoteHttp: true,
              token: 'local-test-token',
              allowedHosts: [`${hostname}:${port}`],
              allowedOrigins: ['*']
            })
          ).toThrow(/non-wildcard/);
        }
      ),
      PROPERTY_CONFIG
    );
  });
});
