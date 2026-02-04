---
title: System Architecture
category: advanced
source: https://github.com/whrit/agent-flow/blob/main/docs/architecture/ARCHITECTURE.md
---

# System architecture overview

Flow-Agent uses a microservice-style, event-driven design with emphasis on scalability, fault tolerance, and extensibility.

## Layers

- **Client**: CLI, API, WebSocket, MCP
- **API Gateway**: Load balancing, rate limiting, auth, routing
- **Core**: Orchestrator, Swarm Manager, Task Engine, Agent Manager, Memory, MCP Server
- **Infrastructure**: Database, Message Queue, Cache, File, Monitoring, Logging

## Core components

- **Orchestrator**: Central coordination; initializes Memory/Agent/Task/Swarm and registers events
- **AgentManager**: Agent lifecycle and selection (spawn, selectAgent)
- **TaskEngine**: Task queue, scheduling, execution
- **SwarmCoordinator**: Topology creation, agent spawning, coordinated execution
- **MemoryManager**: Tiered store/retrieve and indexing

## Design patterns

- Repository pattern
- Strategy pattern (CoordinationStrategy: Centralized, Mesh, etc.)
- Observer / event bus
- Factory (AgentFactory), decorator (Logging, Metrics)

## Tech stack (examples)

Node.js 20+, TypeScript, SQLite (better-sqlite3), Commander.js, Express, ws, Jest, @modelcontextprotocol/sdk, ruv-swarm.
