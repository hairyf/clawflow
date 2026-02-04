---
title: Memory and Vector Search
category: Features
source: https://github.com/ruvnet/claude-flow/blob/main/v3/@claude-flow/memory/README.md
---

# Memory (@claude-flow/memory)

Unified memory with **AgentDB** and **HNSW** for 150x–12,500x faster similarity search (ADR-006, ADR-009). Hybrid backend: SQLite + AgentDB.

## Features

- HNSW vector index (cosine, euclidean, dot, manhattan).
- Quantization: binary, scalar, product (4–32x memory reduction).
- Query builder, cache manager (LRU, TTL), migration from V2.

## Quick Start

```typescript
import { HNSWIndex, AgentDBAdapter, CacheManager } from '@claude-flow/memory';

const index = new HNSWIndex({
  dimensions: 1536,
  M: 16,
  efConstruction: 200,
  metric: 'cosine',
});

await index.addPoint('memory-1', new Float32Array(embedding));
const results = await index.search(queryVector, 10);
```

## Hybrid Backend

```typescript
import { HybridMemoryRepository } from '@claude-flow/memory';

const memory = new HybridMemoryRepository({
  backend: 'agentdb',
  vectorSearch: true,
});

await memory.store({ key: 'knowledge', value: 'context', embedding: [...] });
const results = await memory.search({ query: 'knowledge', limit: 10 });
```

## Why HNSW

- Sub-ms approximate nearest neighbor at scale.
- Supports filters and metadata; pairs with ReasoningBank for pattern store and learning pipeline.
