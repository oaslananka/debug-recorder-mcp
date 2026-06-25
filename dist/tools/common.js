function toStructuredContent(payload) {
    if (typeof payload === 'object' &&
        payload !== null &&
        !Array.isArray(payload)) {
        return payload;
    }
    return { value: payload };
}
/** Wraps an arbitrary payload in the JSON text and structured response shape expected by MCP. */
export function jsonContent(payload) {
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
//# sourceMappingURL=common.js.map