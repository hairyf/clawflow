---
title: Topologies and Consensus
category: advanced
source: https://github.com/whrit/agent-flow/blob/main/docs/reference/SWARM.md
---

# Topologies and consensus

## Topology selection guide

- **Centralized**: Simple tasks, small team, strong coordination and fast decisions
- **Distributed**: High complexity, large team, high availability and scaling
- **Mesh**: Consensus and collaboration, research and innovation, quality and review
- **Hierarchical**: Clear hierarchy, multi-level task breakdown, approval and governance
- **Hybrid**: Different strategy per phase (e.g. plan centralized, execute distributed, review mesh)

## Consensus mechanisms

- **Voting**: Simple majority, weighted, supermajority
- **Algorithms**: Raft, PBFT (Byzantine), PoS
- **Byzantine fault tolerance**: Trust management, response validation, redundancy and backup, monitoring and detection

## Config example (consensus)

```json
{
  "consensus": {
    "algorithm": "pbft",
    "threshold": 0.67,
    "validationRounds": 2
  },
  "byzantineTolerance": {
    "enabled": true,
    "maxByzantineNodes": 3,
    "quarantineEnabled": true
  }
}
```

## Distributed memory

- Consistency: eventual, strong, bounded
- Operations: store/retrieve, distributed locks, pub/sub; namespaces and TTL
