---
title: Swarm Coordination
category: core
source: https://github.com/whrit/agent-flow/blob/main/docs/reference/SWARM.md
---

# Swarm coordination

Swarm is a self-organizing multi-agent network that collaborates on complex tasks via topologies, consensus, and distributed memory.

## Topology types

- **Centralized**: Single coordinator; good for simple tasks and strong coordination
- **Distributed**: Multiple coordinators; high availability and geographic distribution
- **Mesh**: P2P; consensus and collaborative research
- **Hierarchical**: Tree structure; enterprise task decomposition
- **Hybrid**: Combines topologies by phase

## CLI usage

```bash
# Initialize swarm
npx flow-agent@alpha swarm init --topology mesh --max-agents 10

# Execute task
npx flow-agent@alpha swarm execute "Build a web application with authentication"

# Monitor
npx flow-agent@alpha swarm monitor --swarm-id swarm-123 --real-time
npx flow-agent@alpha swarm status
```

## Config example (YAML)

```yaml
swarm:
  name: web-development-team
  topology: hierarchical
  max_agents: 8
agents:
  - type: architect
    capabilities: [system_design, api_design]
    count: 1
  - type: coder
    capabilities: [react, nodejs, typescript]
    count: 3
  - type: tester
    capabilities: [unit_testing, integration_testing]
    count: 2
coordination:
  strategy: hierarchical
  consensus: majority-voting
memory:
  backend: sqlite
  namespace: web-dev-team
```

## Agent types (examples)

`coordinator` | `researcher` | `coder` | `analyst` | `architect` | `tester` | `reviewer` | `optimizer` | `documenter` | `monitor` | `specialist`
