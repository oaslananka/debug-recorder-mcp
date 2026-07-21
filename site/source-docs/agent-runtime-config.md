# Agent Runtime Configuration

This document gives copyable configuration examples for running `debug-recorder-mcp` from popular MCP-capable agent runtimes.

## Claude Code

```bash
claude plugin validate .
claude --plugin-dir .
```

## Codex CLI

Copy `.codex/config.example.toml` into your Codex config.

## VS Code / GitHub Copilot

Use `.vscode/mcp.example.json` as a workspace MCP configuration example.

## OpenCode

Copy `opencode.example.jsonc` to `opencode.json`, or merge the `mcp` block into an existing OpenCode config. OpenCode skills are mirrored under `.opencode/skills/`.

## Generic MCP clients

```bash
npx debug-recorder-mcp
```

## Safety

`debug-recorder-mcp` stores debugging history. Redact secrets and private data before recording, exporting, or sharing sessions.
