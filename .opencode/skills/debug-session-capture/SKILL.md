---
name: debug-session-capture
description: Structured debug-session capture workflow for debug-recorder-mcp, recording symptoms, commands, fix attempts, outcomes, and AI-ready context.
---

# Debug Session Capture Skill

Use this skill when an agent needs to record a debugging session with `debug-recorder-mcp`.

## Workflow

1. Start a session with a clear title, description, tags, error type, and error message.
2. Record important commands and outputs as the debugging process proceeds.
3. Add every attempted fix, including failed attempts.
4. Mark the successful fix only after validation.
5. Close the session as resolved or abandoned.
6. Generate session context for future agents.

## Safety

Redact secrets, tokens, private keys, credentials, and customer data before recording command output.
