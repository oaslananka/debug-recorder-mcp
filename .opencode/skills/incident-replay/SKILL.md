---
name: incident-replay
description: Incident replay workflow for debug-recorder-mcp using past sessions, similar error search, session context, and fix history.
---

# Incident Replay Skill

Use this skill when a user asks whether an error has happened before, how it was fixed, or how to reproduce a previous incident.

## Workflow

1. Search for similar errors and relevant sessions.
2. Inspect the most relevant sessions.
3. Extract symptoms, commands, failed fixes, successful fixes, and environment notes.
4. Summarize what is reusable and what must be revalidated.
5. Recommend the next debugging action.
