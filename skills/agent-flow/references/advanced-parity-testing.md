---
title: Codex Parity and Testing
category: advanced
source: https://github.com/whrit/agent-flow/blob/main/README.md
---

# Codex parity and testing

Flow-Agent tracks gaps and progress between Codex and other providers (e.g. Claude) via docs and tests.

## Docs

- **CODEX_PARITY_REBUILD.md**: Codex parity rebuild plan and backlog
- **CODEX_PARITY_UPDATE.md**: Status updates
- **CODEX_QUICKSTART.md** / **CODEX_README.md**: Usage and configuration

## Testing

```bash
# Unit and integration (Codex)
npm test -- src/__tests__/unit/codex-event-translation-unit.test.ts
npm test -- src/__tests__/integration/codex-provider-integration.test.js

# Smoke (requires CODEX CLI on PATH)
CODEX_SMOKE_TEST=1 npm test:codex:smoke
```

## Roadmap (summary)

1. Publish Flow-Agent CLI and binaries
2. Finish Codex parity and document validated coverage
3. Expand MCP tools and cross-provider telemetry
4. Stabilise CI/CD automation templates

When contributing, update parity trackers and docs (see Contributing section).
