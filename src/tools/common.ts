export type JsonContentResponse = {
  content: Array<{
    type: 'text';
    text: string;
  }>;
};

export type ToolHandler<T> = (input: T) => JsonContentResponse;

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
