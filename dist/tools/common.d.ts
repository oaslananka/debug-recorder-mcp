/** JSON content returned by MCP tool handlers. */
export type JsonContentResponse = {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    structuredContent: Record<string, unknown>;
};
/** Handles a validated MCP tool input and returns JSON text plus structured content. */
export type ToolHandler<T> = (input: T) => JsonContentResponse;
/** Wraps an arbitrary payload in the JSON text and structured response shape expected by MCP. */
export declare function jsonContent(payload: unknown): JsonContentResponse;
//# sourceMappingURL=common.d.ts.map