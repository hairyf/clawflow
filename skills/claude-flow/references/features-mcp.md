---
title: MCP Server
category: Features
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/mcp/README.md
---

# MCP (@claude-flow/mcp)

**MCP 2025-11-25** compliant server: Resources, Prompts, Tasks, multiple transports. Startup &lt;400ms; O(1) tool lookup.

## Features

- Transports: **stdio**, **HTTP**, **WebSocket**, in-process.
- Resources: list, read, subscribe with caching.
- Prompts: templates with arguments and embedded resources.
- Tasks: async with progress and cancellation.
- Pagination, connection pooling, session management, security (CORS, Helmet, auth).

## Quick Start

```typescript
import { defineTool, quickStart } from '@claude-flow/mcp'

const server = await quickStart({
  transport: 'stdio',
  name: 'My MCP Server',
})

server.registerTool(defineTool(
  'greet',
  'Greet a user',
  { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
  async ({ name }) => ({ message: `Hello, ${name}!` })
))

await server.start()
```

## HTTP Transport

```typescript
const server = createMCPServer({
  transport: 'http',
  host: 'localhost',
  port: 3000,
  corsEnabled: true,
  auth: { enabled: true, method: 'token', tokens: ['secret-token'] },
}, logger)
```

## Claude Code Integration

```bash
claude mcp add claude-flow -- npx claude-flow@v3alpha mcp start
```

Tools cover coordination (swarm_init, agent_spawn), memory (memory_search), hooks (hooks_route), and 170+ others.
