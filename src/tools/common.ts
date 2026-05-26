/** JSON content returned by MCP tool handlers. */
export type JsonContentResponse = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

/** Handles a validated MCP tool input and returns JSON text content. */
export type ToolHandler<T> = (input: T) => JsonContentResponse;

/** Wraps an arbitrary payload in the JSON text response shape expected by MCP. */
export function jsonContent(payload: unknown): JsonContentResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ]
  };
}
