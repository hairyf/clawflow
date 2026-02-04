---
title: Swarm Coordination
category: Features
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/swarm/README.md
---

# Swarm Coordination (@claude-flow/swarm)

ADR-003: single coordination engine with hive-mind style intelligence. Agent count is **configurable** (default 15, max 100+).

## Main Components

- **UnifiedSwarmCoordinator** — Canonical engine: topologies, domain routing, parallel execution, consensus.
- **QueenCoordinator** — Task analysis, delegation, health, consensus (majority, supermajority, unanimous, weighted, queen-override).
- **AttentionCoordinator** — Flash / multi-head / linear / hyperbolic attention, MoE routing.
- **FederationHub** — Cross-swarm messaging, ephemeral agents, federation consensus.
- **ConsensusEngines** — Raft, Byzantine (2/3), Gossip.

## Topologies

| Type          | Use case                    |
|---------------|-----------------------------|
| hierarchical  | Queen-led, clear authority  |
| mesh          | Peer-to-peer, redundancy    |
| centralized   | Single coordinator          |
| hybrid        | Mixed, multi-domain         |

## Usage

```typescript
import { createUnifiedSwarmCoordinator } from '@claude-flow/swarm'

const coordinator = createUnifiedSwarmCoordinator({
  topology: { type: 'hierarchical', maxAgents: 15 },
})

await coordinator.initialize()
await coordinator.spawnAgent({ type: 'queen-coordinator' })
// Scale: maxAgents: 50 or 100 for larger swarms
```

## Anti-Drift (Coding Tasks)

- Prefer `topology: 'hierarchical'`, `maxAgents: 6–8`, `strategy: 'specialized'`.
- Use checkpoints (e.g. post-task hooks) and shared memory so the coordinator can enforce goal alignment.
