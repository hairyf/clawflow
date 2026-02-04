---
title: Development Workflow
category: features
source: https://github.com/whrit/agent-flow/blob/main/docs/development/DEVELOPMENT_WORKFLOW.md
---

# Development workflow

Standard flow for developing, building, testing, and releasing within the Flow-Agent repo.

## Common commands

```bash
npm install
npm run build
npm run lint
npm run typecheck
npm test
```

## Targeted tests

```bash
# Codex unit and integration
npm test -- src/__tests__/unit/codex-event-translation-unit.test.ts
npm test -- src/__tests__/integration/codex-provider-integration.test.js
# Smoke (requires CODEX on PATH)
CODEX_SMOKE_TEST=1 npm test:codex:smoke
```

## Contribution requirements

- TypeScript, two-space indent, explicit exports
- Run `npm run lint`, `npm run typecheck`, and relevant Jest suites before PR
- Update parity trackers or docs (e.g. CODEX_PARITY_*.md) when behavior changes
