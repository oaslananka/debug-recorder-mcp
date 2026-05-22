import { describe, expect, it } from '@jest/globals';
import {
  CreateSessionSchema,
  ExportPayloadSchema,
  INPUT_LIMITS,
  RecordCommandSchema
} from '../../src/types.js';

describe('tool input limits', () => {
  it('rejects oversized high-risk text fields', () => {
    expect(
      CreateSessionSchema.safeParse({
        title: 'oversized stack',
        stack_trace: 'x'.repeat(INPUT_LIMITS.largeText + 1),
        tags: []
      }).success
    ).toBe(false);

    expect(
      RecordCommandSchema.safeParse({
        session_id: 'session-1',
        command: 'npm test',
        output: 'x'.repeat(INPUT_LIMITS.largeText + 1)
      }).success
    ).toBe(false);
  });

  it('rejects oversized imports before persistence', () => {
    const result = ExportPayloadSchema.safeParse({
      schema_version: 1,
      sessions: Array.from({ length: INPUT_LIMITS.importSessions + 1 }, () => ({
        id: 'session-1',
        title: 'session',
        description: null,
        error_message: null,
        error_type: null,
        stack_trace: null,
        environment: null,
        language: null,
        framework: null,
        tags: '[]',
        status: 'open',
        created_at: Date.now(),
        updated_at: Date.now()
      })),
      fixes: [],
      commands: []
    });

    expect(result.success).toBe(false);
  });
});
