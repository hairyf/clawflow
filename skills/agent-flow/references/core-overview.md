---
title: Flow-Agent Overview
category: core
source: https://github.com/whrit/agent-flow/blob/main/README.md
---

# Flow-Agent Overview

Flow-Agent is the successor to Claude-Flow, providing multi-agent orchestration, a multi-provider LLM runtime, and an extensible tool surface. Suited for predictable operations, testability, and enterprise deployment.

## Core capabilities

- **Swarm / Hive-Mind**: Orchestrate specialized agents, shared memory, resume long-running workstreams
- **Multi-provider**: Anthropic Claude, OpenAI/Codex, Gemini, Cohere, Ollama; streaming, cost tracking, thread/session persistence
- **Tool surface**: 80+ MCP tools, hook system, PreToolUse modifiers (command safety and routing)
- **Workspace**: Permission-aware spawning, trust validation, local/cloud sandbox
- **Parity tracking**: Codex parity plan and smoke tests

## Quick start

```bash
npx flow-agent@alpha init --force
npx flow-agent@alpha --help
npx flow-agent@alpha swarm "Draft release notes for Flow-Agent"
npx flow-agent@alpha hive-mind spawn "Implement Codex parity smoke tests" --claude
```

## Core concepts

| Concept | Description |
|--------|-------------|
| Swarm | Fire-and-forget multi-agent runs for a single objective |
| Hive-Mind | Stateful, resumable orchestration with memory persistence |
| Providers | LLM backend plugin layer; Codex includes streaming, tool flags, smoke-test hooks |
| Hooks & MCP | Build, deploy, and knowledge workflow automation |
| Memory | SQLite-backed store for task, conversation, and artefact history |

## Development and testing

```bash
npm install && npm run build
npm run lint && npm test
# Codex unit and integration tests
npm test -- src/__tests__/unit/codex-event-translation-unit.test.ts src/__tests__/integration/codex-provider-integration.test.js
# Optional smoke (requires CODEX CLI on PATH)
CODEX_SMOKE_TEST=1 npm test:codex:smoke
```
