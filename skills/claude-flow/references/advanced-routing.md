---
title: Intelligent Routing
category: Advanced
source: https://github.com/ruvnet/claude-flow/blob/main/README.md
---

# Intelligent Task Routing

Q-Learning and MoE (8 experts) route tasks to the best agent. Routing improves over time from outcomes (post-task hooks, trajectory learning).

## Flow

1. **Analyze task** — Complexity, domain, keywords.
2. **Q-Learning lookup** — Historical success per agent.
3. **Recommend** — Agent + confidence; optional explanation.

## Commands

```bash
npx claude-flow@v3alpha route task "implement OAuth2"
npx claude-flow@v3alpha route explain "task description"
npx claude-flow@v3alpha hooks route "refactor auth to JWT" --include-explanation
```

## Coverage-Aware Routing

`route coverage` finds untested or low-coverage code and suggests agents (e.g. tester, security-architect). Combines with test-gap workers and statusline metrics.

## Model Routing (ADR-026)

- **Agent Booster (WASM)** — Simple transforms, $0, &lt;1ms.
- **Haiku/Sonnet** — Medium complexity, lower cost.
- **Opus + Swarm** — High complexity, architecture/security.

Hook signals: `[TASK_MODEL_RECOMMENDATION] Use model="haiku"` (or sonnet/opus). Pass `model` into Task tool for cost control.
