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

function toStructuredContent(payload: unknown): Record<string, unknown> {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    !Array.isArray(payload)
  ) {
    return payload as Record<string, unknown>;
  }

  return { value: payload };
}

/** Wraps an arbitrary payload in the JSON text and structured response shape expected by MCP. */
export function jsonContent(payload: unknown): JsonContentResponse {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(payload, null, 2)
      }
    ],
    structuredContent: toStructuredContent(payload)
  };
}
