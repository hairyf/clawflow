---
title: Providers and Memory
category: core
source: https://github.com/whrit/agent-flow/blob/main/docs/architecture/ARCHITECTURE.md
---

# Providers and Memory

## Multi-provider LLM runtime

- **Providers**: Anthropic Claude, OpenAI/Codex, Google Gemini, Cohere, Ollama
- Streaming, cost tracking, thread/session persistence
- Codex supports streaming, tool flags, and smoke-test hooks

## Memory architecture

- **Backend**: SQLite (WAL), optional Redis-style cache
- **Tiers**: L1 in-memory → L2 cache → L3 persistent
- **Capabilities**: store/retrieve, namespaces, TTL, indexing, compression

## Code example (Memory)

```typescript
// Store
await memory.store({
  key: 'task:analysis:results',
  value: analysisResults,
  namespace: 'swarm-123',
  ttl: 3600000,
  replicate: true
})

// Retrieve
const results = await memory.retrieve({
  key: 'task:analysis:results',
  namespace: 'swarm-123',
  consistency: 'strong'
})
```

## Component relationship

Orchestrator coordinates AgentManager, TaskEngine, SwarmCoordinator, MemoryManager; agents call LLMs via providers; Memory provides context and persistence for tasks and swarms.
