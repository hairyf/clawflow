---
title: Request Flow and Layers
category: Core
source: https://github.com/ruvnet/claude-flow/blob/main/README.md
---

# Core Request Flow

Every request passes through four layers: **User → Orchestration → Agents → Providers**.

## Layer Roles

| Layer         | Components           | Responsibility |
|---------------|----------------------|----------------|
| User          | Claude Code, CLI     | Interface and commands |
| Orchestration | MCP Server, Router, Hooks | Route to correct agents |
| Agents        | 60+ types            | Specialized work (coder, tester, reviewer, …) |
| Providers     | Anthropic, OpenAI, Google, Ollama | LLM reasoning |

## Learning Loop

1. **RETRIEVE** — HNSW fetches similar past patterns.
2. **JUDGE** — Verdict (success/failure) on outcome.
3. **DISTILL** — Extract learnings (e.g. LoRA).
4. **CONSOLIDATE** — EWC++ to avoid forgetting.
5. **ROUTE** — Q-Learning / MoE route future tasks.

Hook signals (e.g. `[AGENT_BOOSTER_AVAILABLE]`, `[TASK_MODEL_RECOMMENDATION]`) drive when to skip LLM (WASM transforms) or choose haiku/sonnet/opus.

## Task Routing Tiers

| Tier | Handler           | Latency | Cost  | Use case |
|------|-------------------|---------|-------|----------|
| 1    | Agent Booster (WASM) | &lt;1ms | $0   | Simple transforms (var→const, add-types) |
| 2    | Haiku/Sonnet      | ~500ms–2s | Low  | Bug fixes, features |
| 3    | Opus + Swarm      | 2–5s   | Higher | Architecture, security, complex design |
