---
title: Hooks and Automation
category: features
source: https://github.com/whrit/agent-flow/blob/main/docs/INDEX.md
---

# Hooks and automation

Hooks provide lifecycle points (pre/post task, post-edit, session end) for metrics, memory, and automation.

## Common hooks

- **pre-task**: Before task start (e.g. `--description`, `--git-integration`)
- **post-edit**: After edit (`--file`, `--memory-key`)
- **post-task**: After task (e.g. `--analyze-performance true`)
- **session-end**: Session end (e.g. `--export-metrics true`)
- **session-restore**: Restore session (`--session-id`, `--reset`)
- **pre-commit**: Pre-commit validation (`--validate`)

## CLI examples

```bash
npx flow-agent@alpha hooks pre-task --description "task description"
npx flow-agent@alpha hooks post-edit --file "path/to/file"
npx flow-agent@alpha hooks post-task --analyze-performance true
npx flow-agent@alpha hooks session-end --export-metrics true
npx flow-agent@alpha hooks session-restore --session-id "project-alpha"
npx flow-agent@alpha hooks pre-commit --validate
```

## Automation executors

- `automation run-workflow`, `automation mle-star`, etc. run structured workflows
- Provider-aware spawn (e.g. `--claude`)
- PreToolUse modifiers for command safety and routing
