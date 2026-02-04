---
title: Codex Provider
category: features
source: https://github.com/whrit/agent-flow/blob/main/docs/CODEX_QUICKSTART.md
---

# Codex provider

Flow-Agent supports Codex as an LLM provider, including streaming, tool flags, and smoke tests.

## Prerequisites

- Node.js >= 20; project has run `npm install` and `npm run build`
- Codex binary on PATH or set via `codexPathOverride`

## Programmatic usage

```javascript
import { join } from 'node:path'
import { CodexProvider } from './dist/providers/codex-provider.js'

const provider = new CodexProvider({
  logger: console,
  config: {
    provider: 'codex',
    model: 'gpt-4o-mini',
    providerOptions: {
      codexPathOverride: join(process.cwd(), 'codex-aarch64-apple-darwin'),
    },
  },
})

await provider.initialize()
const response = await provider.complete({
  messages: [{ role: 'user', content: 'Hello! Can you explain what you are?' }],
  model: 'gpt-4o-mini',
  maxTokens: 100,
})
console.log('Response:', response.content, 'Tokens:', response.usage.totalTokens, 'Cost:', response.cost?.totalCost)
```

## CLI usage

```bash
npx flow-agent@alpha swarm init --provider codex --model gpt-4o-mini
npx flow-agent@alpha task orchestrate "Analyze my codebase" --provider codex
```

## Testing

```bash
npm test -- src/__tests__/unit/codex-event-translation-unit.test.ts src/__tests__/integration/codex-provider-integration.test.js
CODEX_SMOKE_TEST=1 npm test:codex:smoke
```

Parity and gap tracking: `docs/CODEX_PARITY_REBUILD.md`, `docs/CODEX_PARITY_UPDATE.md`.
