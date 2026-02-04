---
title: Hooks and Learning
category: Features
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/hooks/README.md
---

# Hooks (@claude-flow/hooks)

Event-driven lifecycle hooks with **ReasoningBank** learning: intercept and extend operations, route tasks, and learn from outcomes.

## Features

- **Hook Registry** — Priority-based registration and filtering.
- **Hook Executor** — Timeouts, error recovery, result aggregation.
- **Background Daemons** — Metrics, swarm monitoring, pattern learning.
- **12 Background Workers** — Analysis, optimization, automation.
- **Statusline** — Real-time status for Claude Code.
- **MCP Tools** — Programmatic hook access.

## Basic Usage

```typescript
import {
  HookEvent,
  HookExecutor,
  HookPriority,
  HookRegistry,
} from '@claude-flow/hooks'

const registry = new HookRegistry()
const executor = new HookExecutor(registry)

registry.register(
  HookEvent.PreEdit,
  async (context) => {
    console.log(`Editing: ${context.file?.path}`)
    return { success: true }
  },
  HookPriority.Normal,
  { name: 'log-edits' }
)

const result = await executor.preEdit('src/app.ts', 'modify')
```

## Hook Categories

- **Tool lifecycle**: pre-edit, post-edit, pre-command, post-command, pre-task, post-task.
- **Intelligence**: route, explain, pretrain, build-agents, transfer, metrics.
- **Session**: session-start, session-end, session-restore, notify.
- **Intelligence system**: trajectory-start/step/end, pattern-store, pattern-search, stats.

Use `hooks route "<task>" --include-explanation` for task→agent routing; use `hooks pretrain` to bootstrap from the codebase.
