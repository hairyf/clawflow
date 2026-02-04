---
name: claude-flow
description: Claude-Flow v3 enterprise AI orchestration — multi-agent swarms, self-learning hooks, AgentDB/HNSW memory, MCP server, security, and RuVector intelligence. Use when implementing or integrating with Claude-Flow (ruvnet/claude-flow).
metadata:
  source: https://github.com/ruvnet/claude-flow
  version: v3 (alpha)
category: "AI / Agent Orchestration"
---

# Claude-Flow Skill

Agent-oriented reference for **Claude-Flow v3**: architecture, request flow, swarm coordination, memory, hooks, MCP, security, RuVector, plugins, and intelligent routing.

## When to Use This Skill

- Implementing or extending Claude-Flow (agents, swarms, memory, hooks).
- Integrating MCP tools or transports with Claude Code / other MCP clients.
- Designing learning pipelines (ReasoningBank, SONA, EWC++), vector search (HNSW), or security (CVE remediation, AIDefence).
- Choosing topologies, consensus, or model routing (Agent Booster vs Haiku/Sonnet/Opus).

## Reference Index

### Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| **Architecture** | ADRs, module layout, performance targets | [core-architecture](references/core-architecture.md) |
| **Request flow** | Layers, learning loop, task routing tiers | [core-flow](references/core-flow.md) |

### Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| **Swarm** | UnifiedSwarmCoordinator, topologies, consensus, anti-drift | [features-swarm](references/features-swarm.md) |
| **Memory** | AgentDB, HNSW, hybrid backend, quantization | [features-memory](references/features-memory.md) |
| **Hooks** | Lifecycle hooks, ReasoningBank, daemons, workers | [features-hooks](references/features-hooks.md) |
| **MCP** | Server, transports, tools, Claude Code integration | [features-mcp](references/features-mcp.md) |
| **Security** | CVE fixes, validation, AIDefence | [features-security](references/features-security.md) |

### Advanced

| Topic | Description | Reference |
|-------|-------------|-----------|
| **RuVector** | SONA, EWC++, Flash Attention, HNSW, ReasoningBank, PostgreSQL | [advanced-ruvector](references/advanced-ruvector.md) |
| **Plugins** | PluginBuilder, optional plugins, hook events | [advanced-plugins](references/advanced-plugins.md) |
| **Routing** | Q-Learning, MoE, model routing, coverage-aware | [advanced-routing](references/advanced-routing.md) |

## Quick Commands (CLI)

```bash
npx claude-flow@v3alpha init --wizard
npx claude-flow@v3alpha mcp start
npx claude-flow@v3alpha hooks route "<task>" --include-explanation
npx claude-flow@v3alpha memory search -q "query" --limit 5
npx claude-flow@v3alpha swarm init --topology hierarchical
claude mcp add claude-flow -- npx claude-flow@v3alpha mcp start
```
