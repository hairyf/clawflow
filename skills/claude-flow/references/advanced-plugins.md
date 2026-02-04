---
title: Plugin System
category: Advanced
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/plugins
---

# Plugin System

Extensibility via **PluginBuilder**: MCP tools, hooks, workers, providers. Plugins can be shared via IPFS marketplace.

## Components

- **PluginBuilder** — Fluent API for MCP tools, hooks, workers, providers.
- **MCPToolBuilder** — Typed tool parameters (string, number, boolean, enum).
- **HookBuilder** — Priorities, conditions, transformers.
- **WorkerPool** — Min/max workers, task queue.
- **ProviderRegistry** — LLM providers with fallback and cost optimization.
- **AgentDBBridge** — Vector storage with HNSW for plugin data.

## Optional Plugins (Examples)

- **@claude-flow/plugin-agentic-qe** — Quality engineering, TDD, coverage, chaos.
- **@claude-flow/plugin-prime-radiant** — Math/interpretability (sheaf, spectral, causal).
- **@claude-flow/teammate-plugin** — TeammateTool integration, BMSSP WASM, rate limiting.
- Domain: healthcare-clinical, financial-risk, legal-contracts; dev: code-intelligence, test-intelligence, perf-optimizer.

## Hook Events (Plugin)

Session, agent, task, tool, memory, swarm, file, and learning hooks (e.g. session:start, task:post-complete, memory:pre-store). Use for custom lifecycle behavior and integration with ReasoningBank.
