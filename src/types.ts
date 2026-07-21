import { z } from 'zod';

export const INPUT_LIMITS = {
  id: 128,
  title: 200,
  shortText: 512,
  mediumText: 4_000,
  longText: 20_000,
  largeText: 100_000,
  tag: 64,
  tags: 50,
  tagsJson: 4_000,
  importSessions: 1_000,
  importFixes: 5_000,
  importCommands: 10_000,
  importPresets: 1_000
} as const;

const IdSchema = z.string().min(1).max(INPUT_LIMITS.id);
const TagSchema = z.string().min(1).max(INPUT_LIMITS.tag);
const TagsSchema = z.array(TagSchema).max(INPUT_LIMITS.tags);

export const SessionStatusSchema = z.enum(['open', 'resolved', 'abandoned']);
export type SessionStatus = z.infer<typeof SessionStatusSchema>;

export const SessionRowSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(INPUT_LIMITS.title),
  description: z.string().max(INPUT_LIMITS.longText).nullable(),
  error_message: z.string().max(INPUT_LIMITS.longText).nullable(),
  error_type: z.string().max(INPUT_LIMITS.shortText).nullable(),
  stack_trace: z.string().max(INPUT_LIMITS.largeText).nullable(),
  environment: z.string().max(INPUT_LIMITS.mediumText).nullable(),
  language: z.string().max(INPUT_LIMITS.shortText).nullable(),
  framework: z.string().max(INPUT_LIMITS.shortText).nullable(),
  tags: z.string().max(INPUT_LIMITS.tagsJson),
  status: SessionStatusSchema,
  created_at: z.number().int(),
  updated_at: z.number().int(),
  closed_at: z
    .number()
    .int()
    .nullable()
    .describe('Immutable completion timestamp in Unix milliseconds')
});

export const FixRowSchema = z.object({
  id: IdSchema,
  session_id: IdSchema,
  description: z.string().min(1).max(INPUT_LIMITS.longText),
  code_snippet: z.string().max(INPUT_LIMITS.largeText).nullable(),
  worked: z.number().int().min(0).max(1),
  notes: z.string().max(INPUT_LIMITS.longText).nullable(),
  created_at: z.number().int()
});

export const CommandRowSchema = z.object({
  id: IdSchema,
  session_id: IdSchema,
  command: z.string().min(1).max(INPUT_LIMITS.longText),
  output: z.string().max(INPUT_LIMITS.largeText).nullable(),
  exit_code: z.number().int().nullable(),
  ran_at: z.number().int()
});

const SavedSearchPresetRowSchema = z.object({
  name: z.string().min(1).max(INPUT_LIMITS.shortText),
  query: z.string().min(1).max(INPUT_LIMITS.longText),
  language: z.string().max(INPUT_LIMITS.shortText).nullable(),
  framework: z.string().max(INPUT_LIMITS.shortText).nullable(),
  status: SessionStatusSchema.nullable(),
  limit_value: z.number().int().min(1).max(50),
  created_at: z.number().int(),
  updated_at: z.number().int()
});

const SavedSearchPresetSchema = SavedSearchPresetRowSchema.omit({
  limit_value: true
}).extend({
  limit: z.number().int().min(1).max(50)
});

export const CreateSessionSchema = z.object({
  title: z
    .string()
    .min(1)
    .max(INPUT_LIMITS.title)
    .describe('Short description of the bug/problem'),
  description: z
    .string()
    .max(INPUT_LIMITS.longText)
    .optional()
    .describe('Detailed description'),
  error_message: z
    .string()
    .max(INPUT_LIMITS.longText)
    .optional()
    .describe('The exact error message'),
  error_type: z
    .string()
    .max(INPUT_LIMITS.shortText)
    .optional()
    .describe('Error class/type (e.g. TypeError, 404, ENOENT)'),
  stack_trace: z
    .string()
    .max(INPUT_LIMITS.largeText)
    .optional()
    .describe('Stack trace if available'),
  environment: z
    .string()
    .max(INPUT_LIMITS.mediumText)
    .optional()
    .describe('OS, Docker, Node version etc.'),
  language: z
    .string()
    .max(INPUT_LIMITS.shortText)
    .optional()
    .describe('Programming language (typescript, python, go...)'),
  framework: z
    .string()
    .max(INPUT_LIMITS.shortText)
    .optional()
    .describe('Framework (express, nextjs, django...)'),
  tags: TagsSchema.default([]).describe('Tags for categorization')
});

export const AddFixSchema = z.object({
  session_id: IdSchema.describe('Session ID to add fix to'),
  description: z
    .string()
    .min(1)
    .max(INPUT_LIMITS.longText)
    .describe('What the fix does'),
  code_snippet: z
    .string()
    .max(INPUT_LIMITS.largeText)
    .optional()
    .describe('Code that fixed the problem'),
  worked: z.boolean().default(false).describe('Did this fix work?'),
  notes: z
    .string()
    .max(INPUT_LIMITS.longText)
    .optional()
    .describe('Additional notes')
});

export const SearchSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(INPUT_LIMITS.longText)
    .describe('Search query — error message, keyword, or description'),
  language: z
    .string()
    .max(INPUT_LIMITS.shortText)
    .optional()
    .describe('Filter by programming language'),
  framework: z
    .string()
    .max(INPUT_LIMITS.shortText)
    .optional()
    .describe('Filter by framework'),
  status: SessionStatusSchema.optional().describe('Filter by status'),
  limit: z.number().int().min(1).max(50).default(10),
  offset: z
    .number()
    .int()
    .min(0)
    .max(10_000)
    .default(0)
    .describe('Number of matching results to skip for pagination'),
  include_related: z
    .boolean()
    .default(true)
    .describe('Include related-session groups for the current result page'),
  markdown: z
    .boolean()
    .default(false)
    .describe(
      'Include a Markdown incident/postmortem export for the current page'
    )
});

export const SaveSearchPresetSchema = SearchSchema.omit({
  offset: true,
  include_related: true,
  markdown: true
}).extend({
  name: z
    .string()
    .min(1)
    .max(INPUT_LIMITS.shortText)
    .describe('Stable preset name, for example recent-node-crashes')
});

export const ListSearchPresetsSchema = z.object({});

export const DeleteSearchPresetSchema = z.object({
  name: z.string().min(1).max(INPUT_LIMITS.shortText)
});

export const FindSimilarErrorsSchema = z.object({
  error_message: z
    .string()
    .max(INPUT_LIMITS.longText)
    .describe('The error message to search for'),
  limit: z.number().int().min(1).max(20).default(5)
});

export const RecordCommandSchema = z.object({
  session_id: IdSchema.describe('Session ID'),
  command: z
    .string()
    .min(1)
    .max(INPUT_LIMITS.longText)
    .describe('Command that was run'),
  output: z
    .string()
    .max(INPUT_LIMITS.largeText)
    .optional()
    .describe('Command output'),
  exit_code: z.number().int().optional().describe('Exit code (0 = success)')
});

export const CloseSessionSchema = z.object({
  session_id: IdSchema.describe('Session ID to close'),
  status: z.enum(['resolved', 'abandoned']).describe('Final status'),
  summary: z
    .string()
    .max(INPUT_LIMITS.longText)
    .optional()
    .describe('Summary of what fixed it')
});

export const GetSessionSchema = z.object({
  session_id: IdSchema.describe('Session ID')
});

export const UpdateSessionSchema = z
  .object({
    session_id: IdSchema.describe('Session ID to update'),
    title: z.string().min(1).max(INPUT_LIMITS.title).optional(),
    description: z.string().max(INPUT_LIMITS.longText).optional(),
    tags: TagsSchema.optional()
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.tags !== undefined,
    {
      message: 'At least one of title, description or tags must be provided'
    }
  );

export const DeleteSessionSchema = z.object({
  session_id: IdSchema.describe('Session ID to permanently delete'),
  confirm: z.boolean().describe('Must be true to confirm deletion')
});

export const ListSessionsSchema = z.object({
  status: SessionStatusSchema.optional(),
  language: z.string().max(INPUT_LIMITS.shortText).optional(),
  framework: z.string().max(INPUT_LIMITS.shortText).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0)
});

export const ExportSessionsSchema = z.object({
  format: z.enum(['json', 'summary']).default('json').describe('Export format')
});

export const BACKUP_FORMAT_VERSION = 2 as const;

const ImportSessionRowSchema = SessionRowSchema.extend({
  closed_at: z.number().int().nullable().optional()
});

export const ExportPayloadSchema = z.object({
  exported_at: z.string().optional(),
  format_version: z.number().int().min(1).optional(),
  schema_version: z.number().int().min(1),
  sessions: z.array(ImportSessionRowSchema).max(INPUT_LIMITS.importSessions),
  fixes: z.array(FixRowSchema).max(INPUT_LIMITS.importFixes),
  commands: z.array(CommandRowSchema).max(INPUT_LIMITS.importCommands),
  saved_search_presets: z
    .array(SavedSearchPresetRowSchema)
    .max(INPUT_LIMITS.importPresets)
    .optional()
});

export const ImportSessionsSchema = z.object({
  payload: ExportPayloadSchema.describe(
    'Export JSON previously produced by export_sessions'
  ),
  skip_existing: z
    .boolean()
    .default(true)
    .describe(
      'Skip records whose IDs already exist instead of failing the import'
    )
});

export const GetSessionContextSchema = z.object({
  session_id: IdSchema.describe('Session ID'),
  include_commands: z.boolean().default(true),
  include_fixes: z.boolean().default(true)
});

export const GetStatsSchema = z.object({});

export const GetDiagnosticsSchema = z.object({});

export const FixSchema = FixRowSchema.omit({ worked: true }).extend({
  worked: z.boolean()
});

const CommandSchema = CommandRowSchema;

export const SessionSchema = SessionRowSchema.omit({ tags: true }).extend({
  tags: TagsSchema,
  fixes: z.array(FixSchema),
  commands: z.array(CommandSchema)
});

export const ImportCountsSchema = z.object({
  sessions: z.number().int().min(0),
  fixes: z.number().int().min(0),
  commands: z.number().int().min(0),
  presets: z.number().int().min(0)
});

export const StatsOutputSchema = z.object({
  total: z.number().int().min(0),
  resolved: z.number().int().min(0),
  open: z.number().int().min(0),
  abandoned: z.number().int().min(0),
  byLanguage: z.array(
    z.object({ language: z.string(), count: z.number().int().min(0) })
  ),
  topErrorTypes: z.array(
    z.object({ error_type: z.string(), count: z.number().int().min(0) })
  ),
  resolutionRate: z.number().min(0).max(100)
});

export const DiagnosticsOutputSchema = z.object({
  app: z.object({
    name: z.string(),
    version: z.string(),
    schema_version: z.number().int().min(1)
  }),
  runtime: z.object({
    node: z.string(),
    platform: z.string(),
    arch: z.string()
  }),
  config: z.object({
    database_path: z.enum(['[CONFIGURED]', '[DEFAULT]']),
    database_path_configured: z.boolean(),
    redact_before_store: z.boolean(),
    remote_http: z.boolean(),
    http_auth_configured: z.boolean(),
    allowed_hosts_configured: z.boolean(),
    allowed_origins_configured: z.boolean(),
    log_level: z.string()
  }),
  counters: z.object({
    sessions_created: z.number().int().min(0),
    searches: z.number().int().min(0),
    imports: z.number().int().min(0),
    exports: z.number().int().min(0),
    http_rejections: z.record(z.string(), z.number().int().min(0))
  }),
  stats: StatsOutputSchema
});

export const StartDebugSessionOutputSchema = z.object({
  success: z.boolean(),
  session_id: IdSchema,
  message: z.string()
});

export const AddFixOutputSchema = z.object({
  success: z.boolean(),
  fix_id: IdSchema,
  resolved: z.boolean()
});

export const RecordCommandOutputSchema = z.object({
  success: z.boolean(),
  command_id: IdSchema
});

export const CloseSessionOutputSchema = z.object({
  success: z.boolean(),
  session: SessionSchema
});

export const SearchResultOutputSchema = SessionSchema.extend({
  _score: z.number().optional()
});

const SearchPaginationSchema = z.object({
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  returned: z.number().int().min(0),
  has_more: z.boolean(),
  next_offset: z.number().int().min(0).nullable(),
  truncated: z.boolean(),
  window_limit: z.number().int().min(1).nullable()
});

const RelatedSessionGroupSchema = z.object({
  reason: z.enum(['tag', 'error_type', 'language', 'framework']),
  value: z.string(),
  session_ids: z.array(IdSchema),
  count: z.number().int().min(0)
});

export const SearchSessionsOutputSchema = z.object({
  count: z.number().int().min(0),
  results: z.array(SearchResultOutputSchema),
  pagination: SearchPaginationSchema,
  related_groups: z.array(RelatedSessionGroupSchema),
  markdown: z.string().optional()
});

export const SaveSearchPresetOutputSchema = z.object({
  success: z.boolean(),
  preset: SavedSearchPresetSchema
});

export const ListSearchPresetsOutputSchema = z.object({
  count: z.number().int().min(0),
  presets: z.array(SavedSearchPresetSchema)
});

export const DeleteSearchPresetOutputSchema = z.object({
  success: z.boolean(),
  name: z.string(),
  deleted: z.boolean()
});

export const FindSimilarErrorsOutputSchema = z.object({
  found: z.number().int().min(0),
  message: z.string(),
  results: z.array(
    z.object({
      session: SessionSchema,
      similarity: z.number().int().min(0).max(100)
    })
  )
});

export const UpdateSessionOutputSchema = z.object({
  success: z.boolean(),
  session: SessionSchema
});

export const DeleteSessionOutputSchema = z.object({
  success: z.boolean(),
  session_id: IdSchema.optional(),
  message: z.string().optional()
});

export const ListSessionsOutputSchema = z.object({
  count: z.number().int().min(0),
  sessions: z.array(SessionSchema)
});

export type ExportSummarySession = {
  id: string;
  title: string;
  status: SessionStatus;
  language: string | null;
  error_type: string | null;
  created_at: string;
};

export type JsonExportSessionsOutput = {
  format: 'json';
  exported_at: string;
  format_version: typeof BACKUP_FORMAT_VERSION;
  schema_version: number;
  sessions: SessionRow[];
  fixes: FixRow[];
  commands: CommandRow[];
  saved_search_presets: SavedSearchPresetRow[];
};

export type SummaryExportSessionsOutput = {
  format: 'summary';
  exported_at: string;
  format_version: typeof BACKUP_FORMAT_VERSION;
  schema_version: number;
  stats: z.infer<typeof StatsOutputSchema>;
  sessions: ExportSummarySession[];
};

export type ExportSessionsOutput = {
  format: 'json' | 'summary';
  exported_at: string;
  format_version: typeof BACKUP_FORMAT_VERSION;
  schema_version: number;
  sessions: SessionRow[] | ExportSummarySession[];
  fixes?: FixRow[];
  commands?: CommandRow[];
  saved_search_presets?: SavedSearchPresetRow[];
  stats?: z.infer<typeof StatsOutputSchema>;
};

/** Abbreviated session row returned by summary exports. */
export const ExportSummarySessionSchema: z.ZodType<ExportSummarySession> =
  z.object({
    id: IdSchema,
    title: z.string().min(1).max(INPUT_LIMITS.title),
    status: SessionStatusSchema,
    language: z.string().max(INPUT_LIMITS.shortText).nullable(),
    error_type: z.string().max(INPUT_LIMITS.shortText).nullable(),
    created_at: z.string()
  });

/** Full JSON backup response returned by `export_sessions`. */
export const JsonExportSessionsOutputSchema: z.ZodType<JsonExportSessionsOutput> =
  z.object({
    format: z.literal('json'),
    exported_at: z.string(),
    format_version: z.literal(BACKUP_FORMAT_VERSION),
    schema_version: z.number().int().min(1),
    sessions: z.array(SessionRowSchema),
    fixes: z.array(FixRowSchema),
    commands: z.array(CommandRowSchema),
    saved_search_presets: z.array(SavedSearchPresetRowSchema)
  });

/** Lightweight inventory response returned by `export_sessions`. */
export const SummaryExportSessionsOutputSchema: z.ZodType<SummaryExportSessionsOutput> =
  z.object({
    format: z.literal('summary'),
    exported_at: z.string(),
    format_version: z.literal(BACKUP_FORMAT_VERSION),
    schema_version: z.number().int().min(1),
    stats: StatsOutputSchema,
    sessions: z.array(ExportSummarySessionSchema)
  });

/** MCP registration schema accepting both documented export variants. */
export const ExportSessionsOutputSchema: z.ZodType<ExportSessionsOutput> =
  z.object({
    format: z.enum(['json', 'summary']),
    exported_at: z.string(),
    format_version: z.literal(BACKUP_FORMAT_VERSION),
    schema_version: z.number().int().min(1),
    sessions: z.union([
      z.array(SessionRowSchema),
      z.array(ExportSummarySessionSchema)
    ]),
    fixes: z.array(FixRowSchema).optional(),
    commands: z.array(CommandRowSchema).optional(),
    saved_search_presets: z.array(SavedSearchPresetRowSchema).optional(),
    stats: StatsOutputSchema.optional()
  });

export const ImportSessionsOutputSchema = z.object({
  success: z.boolean(),
  format_version: z.number().int().min(1),
  schema_version: z.number().int().min(1),
  imported: ImportCountsSchema,
  skipped: ImportCountsSchema,
  invalid: ImportCountsSchema,
  errors: z.array(z.string())
});

export const GetSessionContextOutputSchema = z.object({
  problem: z.object({
    title: z.string(),
    error_message: z.string().nullable(),
    error_type: z.string().nullable(),
    language: z.string().nullable(),
    framework: z.string().nullable(),
    environment: z.string().nullable(),
    description: z.string().nullable()
  }),
  status: SessionStatusSchema,
  duration_ms: z
    .number()
    .min(0)
    .describe('Elapsed milliseconds; stable after the session is closed'),
  fixes_tried: z.number().int().min(0).optional(),
  working_fix: FixSchema.nullable().optional(),
  failed_fixes: z.array(z.string()).optional(),
  commands: z.array(CommandSchema).optional()
});

export type SessionRow = z.infer<typeof SessionRowSchema>;
export type FixRow = z.infer<typeof FixRowSchema>;
export type CommandRow = z.infer<typeof CommandRowSchema>;
export type SavedSearchPresetRow = {
  name: string;
  query: string;
  language: string | null;
  framework: string | null;
  status: SessionStatus | null;
  limit_value: number;
  created_at: number;
  updated_at: number;
};
export type CreateSession = z.infer<typeof CreateSessionSchema>;
export type AddFix = z.infer<typeof AddFixSchema>;
export type Search = z.infer<typeof SearchSchema>;
export type SaveSearchPreset = z.infer<typeof SaveSearchPresetSchema>;
export type ListSearchPresets = z.infer<typeof ListSearchPresetsSchema>;
export type DeleteSearchPreset = z.infer<typeof DeleteSearchPresetSchema>;
export type FindSimilarErrors = z.infer<typeof FindSimilarErrorsSchema>;
export type RecordCommand = z.infer<typeof RecordCommandSchema>;
export type CloseSession = z.infer<typeof CloseSessionSchema>;
export type GetSession = z.infer<typeof GetSessionSchema>;
export type UpdateSession = z.infer<typeof UpdateSessionSchema>;
export type DeleteSession = z.infer<typeof DeleteSessionSchema>;
export type ListSessions = z.infer<typeof ListSessionsSchema>;
export type ExportSessions = z.infer<typeof ExportSessionsSchema>;
export type ExportPayload = z.infer<typeof ExportPayloadSchema>;
export type ImportSessions = z.infer<typeof ImportSessionsSchema>;
export type GetSessionContext = z.infer<typeof GetSessionContextSchema>;
export type GetStats = z.infer<typeof GetStatsSchema>;
export type GetDiagnostics = z.infer<typeof GetDiagnosticsSchema>;

export type Fix = Omit<FixRow, 'worked'> & { worked: boolean };
export type Session = Omit<SessionRow, 'tags'> & {
  tags: string[];
  fixes: Fix[];
  commands: CommandRow[];
};

export type SavedSearchPreset = Omit<SavedSearchPresetRow, 'limit_value'> & {
  limit: number;
};

export type ImportCounts = {
  sessions: number;
  fixes: number;
  commands: number;
  presets: number;
};

export type ImportResult = {
  format_version: number;
  schema_version: number;
  imported: ImportCounts;
  skipped: ImportCounts;
  invalid: ImportCounts;
  errors: string[];
};
