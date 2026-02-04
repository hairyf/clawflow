---
title: RuVector Intelligence Layer
category: Advanced
source: https://github.com/ruvnet/claude-flow/blob/main/README.md
---

# RuVector Intelligence Layer

RuVector provides the neural and vector infrastructure used by Claude-Flow (SONA, EWC++, Flash Attention, HNSW, ReasoningBank, etc.). Run standalone with `npx ruvector` or via `npx claude-flow@v3alpha hooks intelligence --status`.

## Key Components

| Component       | Purpose                          | Performance / Note        |
|----------------|-----------------------------------|---------------------------|
| SONA           | Self-optimizing routing           | &lt;0.05ms adaptation      |
| EWC++          | Avoid catastrophic forgetting     | Preserves 95%+ knowledge  |
| Flash Attention| Attention computation             | 2.49x–7.47x speedup       |
| HNSW           | Vector search                     | 150x–12,500x faster      |
| ReasoningBank  | Pattern store, trajectory learning| RETRIEVE→JUDGE→DISTILL   |
| LoRA / MicroLoRA | Efficient fine-tuning          | &lt;3µs adaptation        |
| Int8 Quant     | Memory-efficient weights          | 3.92x memory reduction   |
| 9 RL algorithms| Q-Learning, SARSA, PPO, DQN, …    | Task-specific learning    |

## RuVector PostgreSQL

Enterprise vector DB: 77+ SQL functions, ~61µs search, 16,400 QPS. Supports attention mechanisms, GNN layers, hyperbolic embeddings. Use `npx claude-flow ruvector setup` for Docker-based setup and migrations.

## When to Reference

- Optimizing routing or learning (SONA, MoE, ReasoningBank).
- Scaling vector search (HNSW, quantization).
- Integrating Flash Attention or hyperbolic embeddings in pipelines.
