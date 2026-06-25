import { z } from 'zod';
export declare const INPUT_LIMITS: {
    readonly id: 128;
    readonly title: 200;
    readonly shortText: 512;
    readonly mediumText: 4000;
    readonly longText: 20000;
    readonly largeText: 100000;
    readonly tag: 64;
    readonly tags: 50;
    readonly tagsJson: 4000;
    readonly importSessions: 1000;
    readonly importFixes: 5000;
    readonly importCommands: 10000;
};
export declare const SessionStatusSchema: z.ZodEnum<["open", "resolved", "abandoned"]>;
export type SessionStatus = z.infer<typeof SessionStatusSchema>;
export declare const SessionRowSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    error_type: z.ZodNullable<z.ZodString>;
    stack_trace: z.ZodNullable<z.ZodString>;
    environment: z.ZodNullable<z.ZodString>;
    language: z.ZodNullable<z.ZodString>;
    framework: z.ZodNullable<z.ZodString>;
    tags: z.ZodString;
    status: z.ZodEnum<["open", "resolved", "abandoned"]>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string;
    created_at: number;
    updated_at: number;
}, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string;
    created_at: number;
    updated_at: number;
}>;
export declare const FixRowSchema: z.ZodObject<{
    id: z.ZodString;
    session_id: z.ZodString;
    description: z.ZodString;
    code_snippet: z.ZodNullable<z.ZodString>;
    worked: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    created_at: number;
    session_id: string;
    code_snippet: string | null;
    worked: number;
    notes: string | null;
}, {
    description: string;
    id: string;
    created_at: number;
    session_id: string;
    code_snippet: string | null;
    worked: number;
    notes: string | null;
}>;
export declare const CommandRowSchema: z.ZodObject<{
    id: z.ZodString;
    session_id: z.ZodString;
    command: z.ZodString;
    output: z.ZodNullable<z.ZodString>;
    exit_code: z.ZodNullable<z.ZodNumber>;
    ran_at: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    session_id: string;
    command: string;
    output: string | null;
    exit_code: number | null;
    ran_at: number;
}, {
    id: string;
    session_id: string;
    command: string;
    output: string | null;
    exit_code: number | null;
    ran_at: number;
}>;
export declare const CreateSessionSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    error_message: z.ZodOptional<z.ZodString>;
    error_type: z.ZodOptional<z.ZodString>;
    stack_trace: z.ZodOptional<z.ZodString>;
    environment: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    tags: string[];
    description?: string | undefined;
    error_message?: string | undefined;
    error_type?: string | undefined;
    stack_trace?: string | undefined;
    environment?: string | undefined;
    language?: string | undefined;
    framework?: string | undefined;
}, {
    title: string;
    description?: string | undefined;
    error_message?: string | undefined;
    error_type?: string | undefined;
    stack_trace?: string | undefined;
    environment?: string | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const AddFixSchema: z.ZodObject<{
    session_id: z.ZodString;
    description: z.ZodString;
    code_snippet: z.ZodOptional<z.ZodString>;
    worked: z.ZodDefault<z.ZodBoolean>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    session_id: string;
    worked: boolean;
    code_snippet?: string | undefined;
    notes?: string | undefined;
}, {
    description: string;
    session_id: string;
    code_snippet?: string | undefined;
    worked?: boolean | undefined;
    notes?: string | undefined;
}>;
export declare const SearchSchema: z.ZodObject<{
    query: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["open", "resolved", "abandoned"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    include_related: z.ZodDefault<z.ZodBoolean>;
    markdown: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    offset: number;
    include_related: boolean;
    markdown: boolean;
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
}, {
    query: string;
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
    include_related?: boolean | undefined;
    markdown?: boolean | undefined;
}>;
export declare const SaveSearchPresetSchema: z.ZodObject<Omit<{
    query: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["open", "resolved", "abandoned"]>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
    include_related: z.ZodDefault<z.ZodBoolean>;
    markdown: z.ZodDefault<z.ZodBoolean>;
}, "offset" | "include_related" | "markdown"> & {
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    query: string;
    limit: number;
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
}, {
    name: string;
    query: string;
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    limit?: number | undefined;
}>;
export declare const ListSearchPresetsSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const DeleteSearchPresetSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export declare const FindSimilarErrorsSchema: z.ZodObject<{
    error_message: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    error_message: string;
    limit: number;
}, {
    error_message: string;
    limit?: number | undefined;
}>;
export declare const RecordCommandSchema: z.ZodObject<{
    session_id: z.ZodString;
    command: z.ZodString;
    output: z.ZodOptional<z.ZodString>;
    exit_code: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    command: string;
    output?: string | undefined;
    exit_code?: number | undefined;
}, {
    session_id: string;
    command: string;
    output?: string | undefined;
    exit_code?: number | undefined;
}>;
export declare const CloseSessionSchema: z.ZodObject<{
    session_id: z.ZodString;
    status: z.ZodEnum<["resolved", "abandoned"]>;
    summary: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "resolved" | "abandoned";
    session_id: string;
    summary?: string | undefined;
}, {
    status: "resolved" | "abandoned";
    session_id: string;
    summary?: string | undefined;
}>;
export declare const GetSessionSchema: z.ZodObject<{
    session_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    session_id: string;
}, {
    session_id: string;
}>;
export declare const UpdateSessionSchema: z.ZodEffects<z.ZodObject<{
    session_id: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    description?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}, {
    session_id: string;
    description?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}>, {
    session_id: string;
    description?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}, {
    session_id: string;
    description?: string | undefined;
    title?: string | undefined;
    tags?: string[] | undefined;
}>;
export declare const DeleteSessionSchema: z.ZodObject<{
    session_id: z.ZodString;
    confirm: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    confirm: boolean;
}, {
    session_id: string;
    confirm: boolean;
}>;
export declare const ListSessionsSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "resolved", "abandoned"]>>;
    language: z.ZodOptional<z.ZodString>;
    framework: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
}, {
    status?: "open" | "resolved" | "abandoned" | undefined;
    language?: string | undefined;
    framework?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const ExportSessionsSchema: z.ZodObject<{
    format: z.ZodDefault<z.ZodEnum<["json", "summary"]>>;
}, "strip", z.ZodTypeAny, {
    format: "summary" | "json";
}, {
    format?: "summary" | "json" | undefined;
}>;
export declare const ExportPayloadSchema: z.ZodObject<{
    exported_at: z.ZodOptional<z.ZodString>;
    schema_version: z.ZodNumber;
    sessions: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }>, "many">;
    fixes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }>, "many">;
    commands: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    schema_version: number;
    sessions: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }[];
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
    exported_at?: string | undefined;
}, {
    schema_version: number;
    sessions: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }[];
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
    exported_at?: string | undefined;
}>;
export declare const ImportSessionsSchema: z.ZodObject<{
    payload: z.ZodObject<{
        exported_at: z.ZodOptional<z.ZodString>;
        schema_version: z.ZodNumber;
        sessions: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            error_message: z.ZodNullable<z.ZodString>;
            error_type: z.ZodNullable<z.ZodString>;
            stack_trace: z.ZodNullable<z.ZodString>;
            environment: z.ZodNullable<z.ZodString>;
            language: z.ZodNullable<z.ZodString>;
            framework: z.ZodNullable<z.ZodString>;
            tags: z.ZodString;
            status: z.ZodEnum<["open", "resolved", "abandoned"]>;
            created_at: z.ZodNumber;
            updated_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }, {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }>, "many">;
        fixes: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            description: z.ZodString;
            code_snippet: z.ZodNullable<z.ZodString>;
            worked: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }>, "many">;
        commands: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            command: z.ZodString;
            output: z.ZodNullable<z.ZodString>;
            exit_code: z.ZodNullable<z.ZodNumber>;
            ran_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        schema_version: number;
        sessions: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }[];
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        exported_at?: string | undefined;
    }, {
        schema_version: number;
        sessions: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }[];
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        exported_at?: string | undefined;
    }>;
    skip_existing: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    payload: {
        schema_version: number;
        sessions: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }[];
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        exported_at?: string | undefined;
    };
    skip_existing: boolean;
}, {
    payload: {
        schema_version: number;
        sessions: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string;
            created_at: number;
            updated_at: number;
        }[];
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: number;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        exported_at?: string | undefined;
    };
    skip_existing?: boolean | undefined;
}>;
export declare const GetSessionContextSchema: z.ZodObject<{
    session_id: z.ZodString;
    include_commands: z.ZodDefault<z.ZodBoolean>;
    include_fixes: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    session_id: string;
    include_commands: boolean;
    include_fixes: boolean;
}, {
    session_id: string;
    include_commands?: boolean | undefined;
    include_fixes?: boolean | undefined;
}>;
export declare const GetStatsSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const GetDiagnosticsSchema: z.ZodObject<{}, "strip", z.ZodTypeAny, {}, {}>;
export declare const FixSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    session_id: z.ZodString;
    description: z.ZodString;
    code_snippet: z.ZodNullable<z.ZodString>;
    worked: z.ZodNumber;
    notes: z.ZodNullable<z.ZodString>;
    created_at: z.ZodNumber;
}, "worked"> & {
    worked: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    created_at: number;
    session_id: string;
    code_snippet: string | null;
    worked: boolean;
    notes: string | null;
}, {
    description: string;
    id: string;
    created_at: number;
    session_id: string;
    code_snippet: string | null;
    worked: boolean;
    notes: string | null;
}>;
export declare const SessionSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    error_type: z.ZodNullable<z.ZodString>;
    stack_trace: z.ZodNullable<z.ZodString>;
    environment: z.ZodNullable<z.ZodString>;
    language: z.ZodNullable<z.ZodString>;
    framework: z.ZodNullable<z.ZodString>;
    tags: z.ZodString;
    status: z.ZodEnum<["open", "resolved", "abandoned"]>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "tags"> & {
    tags: z.ZodArray<z.ZodString, "many">;
    fixes: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "worked"> & {
        worked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }>, "many">;
    commands: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string[];
    created_at: number;
    updated_at: number;
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
}, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string[];
    created_at: number;
    updated_at: number;
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
}>;
export declare const ImportCountsSchema: z.ZodObject<{
    sessions: z.ZodNumber;
    fixes: z.ZodNumber;
    commands: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    sessions: number;
    fixes: number;
    commands: number;
}, {
    sessions: number;
    fixes: number;
    commands: number;
}>;
export declare const StatsOutputSchema: z.ZodObject<{
    total: z.ZodNumber;
    resolved: z.ZodNumber;
    open: z.ZodNumber;
    abandoned: z.ZodNumber;
    byLanguage: z.ZodArray<z.ZodObject<{
        language: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        language: string;
        count: number;
    }, {
        language: string;
        count: number;
    }>, "many">;
    topErrorTypes: z.ZodArray<z.ZodObject<{
        error_type: z.ZodString;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        error_type: string;
        count: number;
    }, {
        error_type: string;
        count: number;
    }>, "many">;
    resolutionRate: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    open: number;
    resolved: number;
    abandoned: number;
    total: number;
    byLanguage: {
        language: string;
        count: number;
    }[];
    topErrorTypes: {
        error_type: string;
        count: number;
    }[];
    resolutionRate: number;
}, {
    open: number;
    resolved: number;
    abandoned: number;
    total: number;
    byLanguage: {
        language: string;
        count: number;
    }[];
    topErrorTypes: {
        error_type: string;
        count: number;
    }[];
    resolutionRate: number;
}>;
export declare const DiagnosticsOutputSchema: z.ZodObject<{
    app: z.ZodObject<{
        name: z.ZodString;
        version: z.ZodString;
        schema_version: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        version: string;
        name: string;
        schema_version: number;
    }, {
        version: string;
        name: string;
        schema_version: number;
    }>;
    runtime: z.ZodObject<{
        node: z.ZodString;
        platform: z.ZodString;
        arch: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        node: string;
        platform: string;
        arch: string;
    }, {
        node: string;
        platform: string;
        arch: string;
    }>;
    config: z.ZodObject<{
        database_path: z.ZodEnum<["[CONFIGURED]", "[DEFAULT]"]>;
        database_path_configured: z.ZodBoolean;
        redact_before_store: z.ZodBoolean;
        remote_http: z.ZodBoolean;
        http_auth_configured: z.ZodBoolean;
        allowed_hosts_configured: z.ZodBoolean;
        allowed_origins_configured: z.ZodBoolean;
        log_level: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        database_path: "[CONFIGURED]" | "[DEFAULT]";
        database_path_configured: boolean;
        redact_before_store: boolean;
        remote_http: boolean;
        http_auth_configured: boolean;
        allowed_hosts_configured: boolean;
        allowed_origins_configured: boolean;
        log_level: string;
    }, {
        database_path: "[CONFIGURED]" | "[DEFAULT]";
        database_path_configured: boolean;
        redact_before_store: boolean;
        remote_http: boolean;
        http_auth_configured: boolean;
        allowed_hosts_configured: boolean;
        allowed_origins_configured: boolean;
        log_level: string;
    }>;
    counters: z.ZodObject<{
        sessions_created: z.ZodNumber;
        searches: z.ZodNumber;
        imports: z.ZodNumber;
        exports: z.ZodNumber;
        http_rejections: z.ZodRecord<z.ZodString, z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        sessions_created: number;
        searches: number;
        imports: number;
        exports: number;
        http_rejections: Record<string, number>;
    }, {
        sessions_created: number;
        searches: number;
        imports: number;
        exports: number;
        http_rejections: Record<string, number>;
    }>;
    stats: z.ZodObject<{
        total: z.ZodNumber;
        resolved: z.ZodNumber;
        open: z.ZodNumber;
        abandoned: z.ZodNumber;
        byLanguage: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            language: string;
            count: number;
        }, {
            language: string;
            count: number;
        }>, "many">;
        topErrorTypes: z.ZodArray<z.ZodObject<{
            error_type: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            error_type: string;
            count: number;
        }, {
            error_type: string;
            count: number;
        }>, "many">;
        resolutionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }>;
}, "strip", z.ZodTypeAny, {
    app: {
        version: string;
        name: string;
        schema_version: number;
    };
    runtime: {
        node: string;
        platform: string;
        arch: string;
    };
    config: {
        database_path: "[CONFIGURED]" | "[DEFAULT]";
        database_path_configured: boolean;
        redact_before_store: boolean;
        remote_http: boolean;
        http_auth_configured: boolean;
        allowed_hosts_configured: boolean;
        allowed_origins_configured: boolean;
        log_level: string;
    };
    counters: {
        sessions_created: number;
        searches: number;
        imports: number;
        exports: number;
        http_rejections: Record<string, number>;
    };
    stats: {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    };
}, {
    app: {
        version: string;
        name: string;
        schema_version: number;
    };
    runtime: {
        node: string;
        platform: string;
        arch: string;
    };
    config: {
        database_path: "[CONFIGURED]" | "[DEFAULT]";
        database_path_configured: boolean;
        redact_before_store: boolean;
        remote_http: boolean;
        http_auth_configured: boolean;
        allowed_hosts_configured: boolean;
        allowed_origins_configured: boolean;
        log_level: string;
    };
    counters: {
        sessions_created: number;
        searches: number;
        imports: number;
        exports: number;
        http_rejections: Record<string, number>;
    };
    stats: {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    };
}>;
export declare const StartDebugSessionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session_id: z.ZodString;
    message: z.ZodString;
}, "strip", z.ZodTypeAny, {
    message: string;
    session_id: string;
    success: boolean;
}, {
    message: string;
    session_id: string;
    success: boolean;
}>;
export declare const AddFixOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    fix_id: z.ZodString;
    resolved: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    resolved: boolean;
    success: boolean;
    fix_id: string;
}, {
    resolved: boolean;
    success: boolean;
    fix_id: string;
}>;
export declare const RecordCommandOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    command_id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    command_id: string;
}, {
    success: boolean;
    command_id: string;
}>;
export declare const CloseSessionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session: z.ZodObject<Omit<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "tags"> & {
        tags: z.ZodArray<z.ZodString, "many">;
        fixes: z.ZodArray<z.ZodObject<Omit<{
            id: z.ZodString;
            session_id: z.ZodString;
            description: z.ZodString;
            code_snippet: z.ZodNullable<z.ZodString>;
            worked: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodNumber;
        }, "worked"> & {
            worked: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }>, "many">;
        commands: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            command: z.ZodString;
            output: z.ZodNullable<z.ZodString>;
            exit_code: z.ZodNullable<z.ZodNumber>;
            ran_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    session: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    };
}, {
    success: boolean;
    session: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    };
}>;
export declare const SearchResultOutputSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    error_message: z.ZodNullable<z.ZodString>;
    error_type: z.ZodNullable<z.ZodString>;
    stack_trace: z.ZodNullable<z.ZodString>;
    environment: z.ZodNullable<z.ZodString>;
    language: z.ZodNullable<z.ZodString>;
    framework: z.ZodNullable<z.ZodString>;
    tags: z.ZodString;
    status: z.ZodEnum<["open", "resolved", "abandoned"]>;
    created_at: z.ZodNumber;
    updated_at: z.ZodNumber;
}, "tags"> & {
    tags: z.ZodArray<z.ZodString, "many">;
    fixes: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "worked"> & {
        worked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }>, "many">;
    commands: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">;
} & {
    _score: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string[];
    created_at: number;
    updated_at: number;
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
    _score?: number | undefined;
}, {
    description: string | null;
    status: "open" | "resolved" | "abandoned";
    id: string;
    title: string;
    error_message: string | null;
    error_type: string | null;
    stack_trace: string | null;
    environment: string | null;
    language: string | null;
    framework: string | null;
    tags: string[];
    created_at: number;
    updated_at: number;
    fixes: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }[];
    commands: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[];
    _score?: number | undefined;
}>;
export declare const SearchSessionsOutputSchema: z.ZodObject<{
    count: z.ZodNumber;
    results: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "tags"> & {
        tags: z.ZodArray<z.ZodString, "many">;
        fixes: z.ZodArray<z.ZodObject<Omit<{
            id: z.ZodString;
            session_id: z.ZodString;
            description: z.ZodString;
            code_snippet: z.ZodNullable<z.ZodString>;
            worked: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodNumber;
        }, "worked"> & {
            worked: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }>, "many">;
        commands: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            command: z.ZodString;
            output: z.ZodNullable<z.ZodString>;
            exit_code: z.ZodNullable<z.ZodNumber>;
            ran_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }>, "many">;
    } & {
        _score: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        _score?: number | undefined;
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        _score?: number | undefined;
    }>, "many">;
    pagination: z.ZodObject<{
        limit: z.ZodNumber;
        offset: z.ZodNumber;
        returned: z.ZodNumber;
        has_more: z.ZodBoolean;
        next_offset: z.ZodNullable<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        offset: number;
        returned: number;
        has_more: boolean;
        next_offset: number | null;
    }, {
        limit: number;
        offset: number;
        returned: number;
        has_more: boolean;
        next_offset: number | null;
    }>;
    related_groups: z.ZodArray<z.ZodObject<{
        reason: z.ZodEnum<["tag", "error_type", "language", "framework"]>;
        value: z.ZodString;
        session_ids: z.ZodArray<z.ZodString, "many">;
        count: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        value: string;
        count: number;
        reason: "error_type" | "language" | "framework" | "tag";
        session_ids: string[];
    }, {
        value: string;
        count: number;
        reason: "error_type" | "language" | "framework" | "tag";
        session_ids: string[];
    }>, "many">;
    markdown: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    count: number;
    results: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        _score?: number | undefined;
    }[];
    pagination: {
        limit: number;
        offset: number;
        returned: number;
        has_more: boolean;
        next_offset: number | null;
    };
    related_groups: {
        value: string;
        count: number;
        reason: "error_type" | "language" | "framework" | "tag";
        session_ids: string[];
    }[];
    markdown?: string | undefined;
}, {
    count: number;
    results: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
        _score?: number | undefined;
    }[];
    pagination: {
        limit: number;
        offset: number;
        returned: number;
        has_more: boolean;
        next_offset: number | null;
    };
    related_groups: {
        value: string;
        count: number;
        reason: "error_type" | "language" | "framework" | "tag";
        session_ids: string[];
    }[];
    markdown?: string | undefined;
}>;
export declare const SaveSearchPresetOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    preset: z.ZodObject<Omit<{
        name: z.ZodString;
        query: z.ZodString;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        status: z.ZodNullable<z.ZodEnum<["open", "resolved", "abandoned"]>>;
        limit_value: z.ZodNumber;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "limit_value"> & {
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }, {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    preset: {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    };
}, {
    success: boolean;
    preset: {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    };
}>;
export declare const ListSearchPresetsOutputSchema: z.ZodObject<{
    count: z.ZodNumber;
    presets: z.ZodArray<z.ZodObject<Omit<{
        name: z.ZodString;
        query: z.ZodString;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        status: z.ZodNullable<z.ZodEnum<["open", "resolved", "abandoned"]>>;
        limit_value: z.ZodNumber;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "limit_value"> & {
        limit: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }, {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    count: number;
    presets: {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }[];
}, {
    count: number;
    presets: {
        status: "open" | "resolved" | "abandoned" | null;
        language: string | null;
        framework: string | null;
        created_at: number;
        updated_at: number;
        name: string;
        query: string;
        limit: number;
    }[];
}>;
export declare const DeleteSearchPresetOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    name: z.ZodString;
    deleted: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    name: string;
    success: boolean;
    deleted: boolean;
}, {
    name: string;
    success: boolean;
    deleted: boolean;
}>;
export declare const FindSimilarErrorsOutputSchema: z.ZodObject<{
    found: z.ZodNumber;
    message: z.ZodString;
    results: z.ZodArray<z.ZodObject<{
        session: z.ZodObject<Omit<{
            id: z.ZodString;
            title: z.ZodString;
            description: z.ZodNullable<z.ZodString>;
            error_message: z.ZodNullable<z.ZodString>;
            error_type: z.ZodNullable<z.ZodString>;
            stack_trace: z.ZodNullable<z.ZodString>;
            environment: z.ZodNullable<z.ZodString>;
            language: z.ZodNullable<z.ZodString>;
            framework: z.ZodNullable<z.ZodString>;
            tags: z.ZodString;
            status: z.ZodEnum<["open", "resolved", "abandoned"]>;
            created_at: z.ZodNumber;
            updated_at: z.ZodNumber;
        }, "tags"> & {
            tags: z.ZodArray<z.ZodString, "many">;
            fixes: z.ZodArray<z.ZodObject<Omit<{
                id: z.ZodString;
                session_id: z.ZodString;
                description: z.ZodString;
                code_snippet: z.ZodNullable<z.ZodString>;
                worked: z.ZodNumber;
                notes: z.ZodNullable<z.ZodString>;
                created_at: z.ZodNumber;
            }, "worked"> & {
                worked: z.ZodBoolean;
            }, "strip", z.ZodTypeAny, {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }, {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }>, "many">;
            commands: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                session_id: z.ZodString;
                command: z.ZodString;
                output: z.ZodNullable<z.ZodString>;
                exit_code: z.ZodNullable<z.ZodNumber>;
                ran_at: z.ZodNumber;
            }, "strip", z.ZodTypeAny, {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }, {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        }, {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        }>;
        similarity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        session: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        };
        similarity: number;
    }, {
        session: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        };
        similarity: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    message: string;
    results: {
        session: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        };
        similarity: number;
    }[];
    found: number;
}, {
    message: string;
    results: {
        session: {
            description: string | null;
            status: "open" | "resolved" | "abandoned";
            id: string;
            title: string;
            error_message: string | null;
            error_type: string | null;
            stack_trace: string | null;
            environment: string | null;
            language: string | null;
            framework: string | null;
            tags: string[];
            created_at: number;
            updated_at: number;
            fixes: {
                description: string;
                id: string;
                created_at: number;
                session_id: string;
                code_snippet: string | null;
                worked: boolean;
                notes: string | null;
            }[];
            commands: {
                id: string;
                session_id: string;
                command: string;
                output: string | null;
                exit_code: number | null;
                ran_at: number;
            }[];
        };
        similarity: number;
    }[];
    found: number;
}>;
export declare const UpdateSessionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session: z.ZodObject<Omit<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "tags"> & {
        tags: z.ZodArray<z.ZodString, "many">;
        fixes: z.ZodArray<z.ZodObject<Omit<{
            id: z.ZodString;
            session_id: z.ZodString;
            description: z.ZodString;
            code_snippet: z.ZodNullable<z.ZodString>;
            worked: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodNumber;
        }, "worked"> & {
            worked: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }>, "many">;
        commands: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            command: z.ZodString;
            output: z.ZodNullable<z.ZodString>;
            exit_code: z.ZodNullable<z.ZodNumber>;
            ran_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    session: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    };
}, {
    success: boolean;
    session: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    };
}>;
export declare const DeleteSessionOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    session_id: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    message?: string | undefined;
    session_id?: string | undefined;
}, {
    success: boolean;
    message?: string | undefined;
    session_id?: string | undefined;
}>;
export declare const ListSessionsOutputSchema: z.ZodObject<{
    count: z.ZodNumber;
    sessions: z.ZodArray<z.ZodObject<Omit<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "tags"> & {
        tags: z.ZodArray<z.ZodString, "many">;
        fixes: z.ZodArray<z.ZodObject<Omit<{
            id: z.ZodString;
            session_id: z.ZodString;
            description: z.ZodString;
            code_snippet: z.ZodNullable<z.ZodString>;
            worked: z.ZodNumber;
            notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodNumber;
        }, "worked"> & {
            worked: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }, {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }>, "many">;
        commands: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            session_id: z.ZodString;
            command: z.ZodString;
            output: z.ZodNullable<z.ZodString>;
            exit_code: z.ZodNullable<z.ZodNumber>;
            ran_at: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }, {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    sessions: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }[];
    count: number;
}, {
    sessions: {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string[];
        created_at: number;
        updated_at: number;
        fixes: {
            description: string;
            id: string;
            created_at: number;
            session_id: string;
            code_snippet: string | null;
            worked: boolean;
            notes: string | null;
        }[];
        commands: {
            id: string;
            session_id: string;
            command: string;
            output: string | null;
            exit_code: number | null;
            ran_at: number;
        }[];
    }[];
    count: number;
}>;
export declare const ExportSessionsOutputSchema: z.ZodObject<{
    exported_at: z.ZodString;
    schema_version: z.ZodNumber;
    sessions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }>, "many">>;
    fixes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }>, "many">>;
    commands: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">>;
    stats: z.ZodOptional<z.ZodObject<{
        total: z.ZodNumber;
        resolved: z.ZodNumber;
        open: z.ZodNumber;
        abandoned: z.ZodNumber;
        byLanguage: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            language: string;
            count: number;
        }, {
            language: string;
            count: number;
        }>, "many">;
        topErrorTypes: z.ZodArray<z.ZodObject<{
            error_type: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            error_type: string;
            count: number;
        }, {
            error_type: string;
            count: number;
        }>, "many">;
        resolutionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    exported_at: z.ZodString;
    schema_version: z.ZodNumber;
    sessions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }>, "many">>;
    fixes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }>, "many">>;
    commands: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">>;
    stats: z.ZodOptional<z.ZodObject<{
        total: z.ZodNumber;
        resolved: z.ZodNumber;
        open: z.ZodNumber;
        abandoned: z.ZodNumber;
        byLanguage: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            language: string;
            count: number;
        }, {
            language: string;
            count: number;
        }>, "many">;
        topErrorTypes: z.ZodArray<z.ZodObject<{
            error_type: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            error_type: string;
            count: number;
        }, {
            error_type: string;
            count: number;
        }>, "many">;
        resolutionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    exported_at: z.ZodString;
    schema_version: z.ZodNumber;
    sessions: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        title: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        stack_trace: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        tags: z.ZodString;
        status: z.ZodEnum<["open", "resolved", "abandoned"]>;
        created_at: z.ZodNumber;
        updated_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }, {
        description: string | null;
        status: "open" | "resolved" | "abandoned";
        id: string;
        title: string;
        error_message: string | null;
        error_type: string | null;
        stack_trace: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
        tags: string;
        created_at: number;
        updated_at: number;
    }>, "many">>;
    fixes: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: number;
        notes: string | null;
    }>, "many">>;
    commands: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">>;
    stats: z.ZodOptional<z.ZodObject<{
        total: z.ZodNumber;
        resolved: z.ZodNumber;
        open: z.ZodNumber;
        abandoned: z.ZodNumber;
        byLanguage: z.ZodArray<z.ZodObject<{
            language: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            language: string;
            count: number;
        }, {
            language: string;
            count: number;
        }>, "many">;
        topErrorTypes: z.ZodArray<z.ZodObject<{
            error_type: z.ZodString;
            count: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            error_type: string;
            count: number;
        }, {
            error_type: string;
            count: number;
        }>, "many">;
        resolutionRate: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }, {
        open: number;
        resolved: number;
        abandoned: number;
        total: number;
        byLanguage: {
            language: string;
            count: number;
        }[];
        topErrorTypes: {
            error_type: string;
            count: number;
        }[];
        resolutionRate: number;
    }>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ImportSessionsOutputSchema: z.ZodObject<{
    success: z.ZodBoolean;
    schema_version: z.ZodNumber;
    imported: z.ZodObject<{
        sessions: z.ZodNumber;
        fixes: z.ZodNumber;
        commands: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sessions: number;
        fixes: number;
        commands: number;
    }, {
        sessions: number;
        fixes: number;
        commands: number;
    }>;
    skipped: z.ZodObject<{
        sessions: z.ZodNumber;
        fixes: z.ZodNumber;
        commands: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sessions: number;
        fixes: number;
        commands: number;
    }, {
        sessions: number;
        fixes: number;
        commands: number;
    }>;
    invalid: z.ZodObject<{
        sessions: z.ZodNumber;
        fixes: z.ZodNumber;
        commands: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        sessions: number;
        fixes: number;
        commands: number;
    }, {
        sessions: number;
        fixes: number;
        commands: number;
    }>;
    errors: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    schema_version: number;
    success: boolean;
    imported: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    skipped: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    invalid: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    errors: string[];
}, {
    schema_version: number;
    success: boolean;
    imported: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    skipped: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    invalid: {
        sessions: number;
        fixes: number;
        commands: number;
    };
    errors: string[];
}>;
export declare const GetSessionContextOutputSchema: z.ZodObject<{
    problem: z.ZodObject<{
        title: z.ZodString;
        error_message: z.ZodNullable<z.ZodString>;
        error_type: z.ZodNullable<z.ZodString>;
        language: z.ZodNullable<z.ZodString>;
        framework: z.ZodNullable<z.ZodString>;
        environment: z.ZodNullable<z.ZodString>;
        description: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string | null;
        title: string;
        error_message: string | null;
        error_type: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
    }, {
        description: string | null;
        title: string;
        error_message: string | null;
        error_type: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
    }>;
    status: z.ZodEnum<["open", "resolved", "abandoned"]>;
    duration_ms: z.ZodNumber;
    fixes_tried: z.ZodOptional<z.ZodNumber>;
    working_fix: z.ZodOptional<z.ZodNullable<z.ZodObject<Omit<{
        id: z.ZodString;
        session_id: z.ZodString;
        description: z.ZodString;
        code_snippet: z.ZodNullable<z.ZodString>;
        worked: z.ZodNumber;
        notes: z.ZodNullable<z.ZodString>;
        created_at: z.ZodNumber;
    }, "worked"> & {
        worked: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }, {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    }>>>;
    failed_fixes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    commands: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        session_id: z.ZodString;
        command: z.ZodString;
        output: z.ZodNullable<z.ZodString>;
        exit_code: z.ZodNullable<z.ZodNumber>;
        ran_at: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }, {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "open" | "resolved" | "abandoned";
    problem: {
        description: string | null;
        title: string;
        error_message: string | null;
        error_type: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
    };
    duration_ms: number;
    commands?: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[] | undefined;
    fixes_tried?: number | undefined;
    working_fix?: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    } | null | undefined;
    failed_fixes?: string[] | undefined;
}, {
    status: "open" | "resolved" | "abandoned";
    problem: {
        description: string | null;
        title: string;
        error_message: string | null;
        error_type: string | null;
        environment: string | null;
        language: string | null;
        framework: string | null;
    };
    duration_ms: number;
    commands?: {
        id: string;
        session_id: string;
        command: string;
        output: string | null;
        exit_code: number | null;
        ran_at: number;
    }[] | undefined;
    fixes_tried?: number | undefined;
    working_fix?: {
        description: string;
        id: string;
        created_at: number;
        session_id: string;
        code_snippet: string | null;
        worked: boolean;
        notes: string | null;
    } | null | undefined;
    failed_fixes?: string[] | undefined;
}>;
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
export type Fix = Omit<FixRow, 'worked'> & {
    worked: boolean;
};
export type Command = CommandRow;
export type Session = Omit<SessionRow, 'tags'> & {
    tags: string[];
    fixes: Fix[];
    commands: Command[];
};
export type SavedSearchPreset = Omit<SavedSearchPresetRow, 'limit_value'> & {
    limit: number;
};
export type ImportCounts = {
    sessions: number;
    fixes: number;
    commands: number;
};
export type ImportResult = {
    schema_version: number;
    imported: ImportCounts;
    skipped: ImportCounts;
    invalid: ImportCounts;
    errors: string[];
};
//# sourceMappingURL=types.d.ts.map