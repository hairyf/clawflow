---
title: CLI Commands Reference
category: core
source: https://github.com/whrit/agent-flow/blob/main/docs/INDEX.md
---

# CLI commands reference

Entry: `npx flow-agent@alpha` (compatible with `claude-flow` entry points).

## Init and version

```bash
npx flow-agent@alpha init --force
npx flow-agent@alpha --version
npx flow-agent@alpha --help
```

## Swarm

```bash
npx flow-agent@alpha swarm "task description"
npx flow-agent@alpha swarm --agents 8 "build full-stack e-commerce platform"
npx flow-agent@alpha swarm status
npx flow-agent@alpha sparc modes
npx flow-agent@alpha agents list
```

## Hive-Mind

```bash
npx flow-agent@alpha hive-mind spawn "objective" --claude
```

## SPARC

```bash
npx flow-agent@alpha sparc tdd "user authentication system"
npx flow-agent@alpha sparc batch research,architecture,code "microservices platform"
npx flow-agent@alpha sparc pipeline "e-commerce platform with payments"
```

## MCP and Hooks

```bash
npx flow-agent@alpha mcp start
npx flow-agent@alpha mcp status
npx flow-agent@alpha hooks pre-task --description "task description"
npx flow-agent@alpha hooks post-edit --file "path/to/file"
npx flow-agent@alpha hooks session-end --export-metrics true
```

## Memory

```bash
npx flow-agent@alpha memory clear
npx flow-agent@alpha memory optimize --threshold 0.8
```

## GitHub integration (if configured)

```bash
npx flow-agent@alpha github init
npx flow-agent@alpha github pr-manager
npx flow-agent@alpha github code-review-swarm --pr 123
```
