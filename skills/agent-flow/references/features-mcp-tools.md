---
title: MCP Tools Surface
category: features
source: https://github.com/whrit/agent-flow/blob/main/docs/reference/MCP_TOOLS.md
---

# MCP tools surface

Flow-Agent exposes 80+ MCP tools. Naming: `mcp__provider__tool_name` (e.g. `mcp__claude-flow__*`, `mcp__ruv-swarm__*`).

## Categories

- **Swarm coordination**: swarm_init, agent_spawn, task_orchestrate, swarm_status, swarm_scale, load_balance, etc.
- **Memory & persistence**: memory_usage, memory_search, memory_persist, memory_backup/restore, state_snapshot, context_restore
- **Analysis & monitoring**: performance_report, bottleneck_analyze, token_usage, task_status, health_check, metrics_collect
- **Workflow & automation**: workflow_create, workflow_execute, sparc_mode, pipeline_create, scheduler_manage, batch_process, parallel_execute
- **GitHub**: github_repo_analyze, github_pr_manage, github_issue_track, github_code_review
- **System**: terminal_execute, config_manage, security_scan, backup_create, log_analysis, diagnostic_run

## Call examples

```json
{
  "tool": "mcp__claude-flow__swarm_init",
  "params": {
    "topology": "hierarchical",
    "maxAgents": 12,
    "strategy": "auto",
    "swarmId": "project-alpha"
  }
}
```

```json
{
  "tool": "mcp__claude-flow__memory_usage",
  "params": {
    "action": "store",
    "key": "project_requirements",
    "value": { "features": ["auth", "dashboard"] },
    "namespace": "project-alpha",
    "type": "knowledge"
  }
}
```

## Batching and chaining

- Use `mcp__claude-flow__parallel_execute` for concurrent operations
- Tools can be chained into workflows (e.g. swarm_init → agent_spawn → task_orchestrate)
