# Roadmap

## v1.1.0 - Search and usability

- [ ] Add pagination metadata to `search_sessions` results so large histories can be explored incrementally.
- [ ] Add saved search presets for frequently recurring error families.
- [ ] Surface related sessions grouped by shared error fingerprints or tags.
- [ ] Add optional Markdown export tailored for incident writeups and postmortems.

## v1.2.0 - Integrations

- [ ] Build a lightweight VS Code extension that can open and continue a debug session from the editor.
- [ ] Add a Git hook helper that suggests recently related session IDs during commit authoring.
- [ ] Explore linking alerts from adjacent MCP tools into relevant debug sessions.

## v1.3.0 - Team workflows

- [ ] Add a shareable, compact export format for handing a session to another developer.
- [ ] Add import anonymization helpers for safely sharing incident history across teams.
- [ ] Add opt-in labels for ownership, incident severity, and handoff status.

## v2.0.0 - Intelligence

- [ ] Generate fix recommendations from repeated successful remediation patterns.
- [ ] Report MTTR and repeated-incident metrics directly from stored sessions.
- [ ] Offer higher-level error clustering and frequency summaries for recurring failures.
