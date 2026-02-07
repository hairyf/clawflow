---
specs: .bonfire/specs/
docs: .bonfire/docs/
git: commit-all
linear: false
---

# Session Context: clawflow

**Date**: 2025-02-07
**Status**: Active
**Branch**: main

---

## Current State

clawflow 是一个基于 nanobot 架构的 TypeScript/Node.js AI 代理框架，采用 monorepo 结构。当前实现包括：

- **packages/core**: 核心包，包含 agent loop、bus、tools、cron、providers、session、config 等模块
- **skills/nanobot**: 从 nanobot Python 项目提取的技能参考
- **sources/nanobot**: 原始 nanobot Python 源码

---

## Recent Sessions

- **2025-02-07**: 实现 **providers/transcription**：GroqTranscriptionProvider（Whisper API、transcribe(filePath)）；Telegram 语音/音频消息下载 + 转写后送入 agent；导出自 core
- **2025-02-07**: 实现 **heartbeat/**：HeartbeatService（定时读 workspace/HEARTBEAT.md、onHeartbeat 回调、triggerNow）；config 增加 heartbeat.enabled / heartbeat.intervalS；导出自 core
- **2025-02-07**: 实现 **channels/** 模块：base、manager、telegram、discord、feishu、whatsapp；config schema 增加 channels/gateway；CLI 增加 `channels status`（@clack/prompts intro/outro）
- **2025-02-07**: Bonfire start；完成 nanobot vs clawflow 模块对比，整理未实现模块与实现差异清单，作为待办记入 Next Priorities

---

## Next Session Priorities

**未实现模块**（对照 nanobot）：
1. [x] **channels/** - 已实现（base、manager、telegram、discord、feishu、whatsapp）
2. [x] **heartbeat/** - HeartbeatService（定时读 HEARTBEAT.md 唤醒 agent）
3. [x] **providers/transcription** - GroqTranscriptionProvider（语音转文字）
4. [ ] **bridge/** - WhatsApp WebSocket 桥接（独立 TS 项目）
5. [ ] **gateway 命令** - 启动 channels + heartbeat + cron + agent 的网关模式

**实现差异**（待对齐）：
6. [ ] **providers** - 多 provider 自动路由（nanobot 用 LiteLLM，clawflow 仅 OpenAI 兼容 API）
7. [ ] **config schema** - 按 model 匹配 provider（channels/gateway 已补全）
8. [ ] **cli 命令** - gateway、channels login、cron enable/disable/run（channels status 已实现）
9. [ ] **cron add** - 支持 --at、--deliver、--to、--channel
10. [ ] **cron service** - 增加 enableJob/disableJob

---

## Key Resources

**Code References**:
- CLI 入口: `packages/core/src/cli/index.ts`
- Agent 主循环: `packages/core/src/agent/loop.ts`
- Cron 服务: `packages/core/src/cron/service.ts`
- 配置加载: `packages/core/src/config/loader.ts`

**External Links**:
- [GitHub Repository](https://github.com/hairyf/clawflow)
- [nanobot skill](skills/nanobot/SKILL.md)

---

## Codemap

**Entry Points**:
- `pnpm start` / `clawflow` → `packages/core/bin/index.mjs`
- CLI: `packages/core/src/cli/index.ts`

**Core Components**:
- `packages/core/src/agent/` - 代理循环、上下文、记忆、技能、子代理
- `packages/core/src/bus/` - 事件总线、队列
- `packages/core/src/channels/` - 聊天渠道（base、manager、telegram、discord、feishu、whatsapp）
- `packages/core/src/heartbeat/` - 定时读 HEARTBEAT.md 唤醒 agent（HeartbeatService）
- `packages/core/src/tools/` - 工具注册、cron、filesystem、message、shell、spawn、web
- `packages/core/src/providers/` - LLM 提供方（base、openai）、语音转写（transcription / Groq）
- `packages/core/src/cron/` - 定时任务服务
- `packages/core/src/session/` - 会话管理
- `packages/core/src/config/` - 配置加载与 schema
