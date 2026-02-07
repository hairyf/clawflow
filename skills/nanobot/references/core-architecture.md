---
source: https://github.com/HKUDS/nanobot
title: nanobot Architecture
category: core
---

# nanobot 架构概览

nanobot 是受 Clawdbot 启发的超轻量个人 AI 助手，核心约 3.4k 行代码。架构围绕 **Agent Loop ↔ Message Bus ↔ Channels** 解耦。

## 项目结构

```
nanobot/
├── agent/          # 核心 Agent：loop、context、memory、skills、tools
├── bus/            # 消息路由：inbound/outbound 队列
├── channels/       # 接入：Telegram、Discord、WhatsApp、Feishu
├── cron/           # 定时任务
├── heartbeat/      # 周期性唤醒
├── providers/      # LLM 提供商（OpenRouter、OpenAI、vLLM 等）
├── session/        # 会话管理
├── config/         # 配置加载与 schema
└── cli/            # 命令行入口
```

## 数据流

1. **Channels** 收到用户消息 → 推入 `MessageBus.inbound`
2. **AgentLoop** 从 bus 取消息 → 构建 context（history + memory + skills）→ 调 LLM
3. LLM 返回 content 或 tool_calls → 执行 tools → 将结果追加到 messages，继续循环
4. 无 tool_calls 时得到最终回复 → 推入 `MessageBus.outbound`
5. **Gateway** 的 dispatch 任务按 channel 订阅把 outbound 发给对应 channel

## 设计要点

- **Bus 解耦**：Channel 与 Agent 仅通过 `InboundMessage` / `OutboundMessage` 通信。
- **Workspace**：默认 `~/.nanobot/workspace`，含 `AGENTS.md`、`SOUL.md`、`USER.md`、`TOOLS.md`、`memory/`、`skills/`。
- **Session**：按 `channel:chat_id` 区分会话，历史持久化在 workspace。

## 参考

- README: <https://github.com/HKUDS/nanobot#-architecture>
- 源码: `nanobot/agent/loop.py`, `nanobot/bus/queue.py`
