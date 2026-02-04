---
title: Hive-Mind Stateful Orchestration
category: core
source: https://github.com/whrit/agent-flow/blob/main/README.md
---

# Hive-Mind stateful orchestration

Hive-Mind provides stateful, resumable orchestration and memory persistence for long-running, multi-session workstreams.

## Versus Swarm

| Mode | Characteristics |
|------|------------------|
| Swarm | One-shot, fire-and-forget, single objective |
| Hive-Mind | Stateful, resumable; memory and task history persisted |

## CLI usage

```bash
# Spawn persistent hive-mind workspace (with Claude)
npx flow-agent@alpha hive-mind spawn "Implement Codex parity smoke tests" --claude
```

## Typical use cases

- Long-running tasks that resume across sessions
- Multi-phase pipelines (plan → execute → integrate → review)
- Team collaboration with shared memory and context
- Storing tasks, conversations, and artefacts with Memory (SQLite)

## Memory and recovery

- Tasks, conversations, and artefacts written to SQLite
- Session restore and context recovery supported
- Hooks (e.g. `session-end`, `session-restore`) for export/restore and metrics
