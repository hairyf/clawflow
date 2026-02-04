---
title: SPARC Methodology
category: features
source: https://github.com/whrit/agent-flow/blob/main/docs/reference/SPARC.md
---

# SPARC methodology

SPARC: Specification → Pseudocode → Architecture → Refinement → Code. Structured development by phase, with dedicated execution environments and tool sets per phase.

## Phase meanings

| Phase | Meaning |
|-------|---------|
| Specification | Define what to build first |
| Pseudocode | Logic and flow planning |
| Architecture | System structure and relationships |
| Refinement | Iterative improvement of design and implementation |
| Code | Implement with clear direction |

## Common modes

- **orchestrator**: Multi-agent task coordination
- **coder**: Autonomous code generation and implementation
- **architect**: System design and architecture
- **tdd**: Test-driven development (Red–Green–Refactor)
- **researcher**: Research and information gathering
- **analyst**: Code and data analysis

## CLI examples

```bash
npx flow-agent@alpha sparc tdd "user authentication system"
npx flow-agent@alpha sparc batch research,architecture,code "microservices platform"
npx flow-agent@alpha sparc pipeline "e-commerce platform with payments"
npx flow-agent@alpha sparc modes
```

## MCP tool

`mcp__claude-flow__sparc_mode` runs a given SPARC mode; pass `mode`, `project_context`, and optional `previous_artifacts`.
