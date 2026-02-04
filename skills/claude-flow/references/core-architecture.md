---
title: Core Architecture
category: Core
source: https://github.com/ruvnet/claude-flow/blob/main/README.md
---

# Claude-Flow V3 Core Architecture

Claude-Flow is an enterprise AI orchestration platform that turns Claude Code into a multi-agent development system. Requests flow through: **User → CLI/MCP → Router → Swarm → Agents → Memory → LLM Providers**, with a learning loop feeding outcomes back into routing.

## Design Principles

- **Domain-Driven Design (ADR-002)**: Bounded contexts (security, memory, swarm, integration).
- **Single coordination engine (ADR-003)**: `UnifiedSwarmCoordinator` as canonical swarm engine.
- **Plugin microkernel (ADR-004)**: Extensibility via plugins, workers, hooks, providers.
- **MCP-first API (ADR-005)**: Consistent MCP tools and transports across modules.
- **Unified memory (ADR-006)**: AgentDB with HNSW for vector search.
- **Event sourcing (ADR-007)**: Full audit trail for state changes.
- **Node.js 20+ only (ADR-010)**: No Deno; Vitest for tests (ADR-008).

## Module Layout (V3)

```
@claude-flow/
├── security   → CVE fixes, validation, path safety
├── memory     → AgentDB, HNSW, hybrid SQLite+AgentDB
├── swarm      → 15-agent (configurable to 100+) coordination
├── integration→ agentic-flow bridge, SONA
├── hooks      → Lifecycle hooks, ReasoningBank, daemons
├── mcp        → MCP 2025-11-25 server (stdio/HTTP/WS)
├── cli        → 26 commands, 140+ subcommands
├── neural     → SONA, learning algorithms
├── plugins    → Plugin SDK, RuVector bridge
├── shared     → types, events, core, hooks, resilience
└── ...
```

## Performance Targets

| Metric        | Target           | Use |
|---------------|------------------|-----|
| HNSW search   | 150x–12,500x     | Memory retrieval |
| Flash Attention | 2.49x–7.47x   | Attention ops |
| MCP response  | &lt;100ms        | Tool calls |
| CLI startup   | &lt;500ms        | Cold start |
| Memory reduction | 50–75%        | Quantization |
