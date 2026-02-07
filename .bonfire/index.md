---
specs: .bonfire/specs/
docs: .bonfire/docs/
git: commit-all
linear: false
---

# Session Context: clawflow

**Date**: 2025-02-07
**Status**: Closed
**Branch**: main

---

## Current State

clawflow 是一个基于 nanobot 架构的 TypeScript/Node.js AI 代理框架，采用 monorepo 结构。当前实现包括：

- **packages/core**: 核心包，包含 agent loop、bus、tools、cron、providers、session、config 等模块
- **skills/nanobot**: 从 nanobot Python 项目提取的技能参考
- **sources/nanobot**: 原始 nanobot Python 源码

---

## Recent Sessions

- **2025-02-07** (本会话): **AI SDK 与 Provider 对齐** — 更新 ai/@ai-sdk/* 至最新版本；重构 ai-sdk.ts（去除 any、正确类型、ModelMessage 转换）；对齐 nanobot：config 新增 zhipu、moonshot，loader 路由与回退顺序；ai-sdk 支持 Zhipu（zhipu-ai-provider）、Moonshot（createOpenAI + apiBase）、kimi-k2.5 强制 temperature=1.0；移除冗余 openai.ts；关闭 ESLint explicit-function-return-type。
- **2025-02-07**: 实现 **gateway 命令**（gateway/index.ts、CLI `clawflow gateway start`）；启动 channels + heartbeat + cron + agent 的网关模式；任务 5 完成。
- **2025-02-07**: Bonfire start → 实现 **bridge/**（BridgeServer、crossws、Baileys、config.bridge、CLI `clawflow bridge start`）；任务 4 完成。Session ended: 健康检查通过，无断链或孤立 spec/doc。
- **2025-02-07**: 实现 **heartbeat/**（HeartbeatService、config.heartbeat）、**providers/transcription**（GroqTranscriptionProvider、Telegram 语音转写）；任务 2、3 完成
- **2025-02-07**: 实现 **channels/** 模块：base、manager、telegram、discord、feishu、whatsapp；config schema 增加 channels/gateway；CLI 增加 `channels status`
- **2025-02-07**: Bonfire start；完成 nanobot vs clawflow 模块对比，整理未实现模块与实现差异清单，作为待办记入 Next Priorities

---

## Next Session Priorities

### 一、已实现模块
1. [x] **channels/** - base、manager、telegram、discord、feishu、whatsapp
2. [x] **heartbeat/** - HeartbeatService
3. [x] **providers/transcription** - GroqTranscriptionProvider
4. [x] **bridge/** - crossws + Baileys，CLI: `clawflow bridge start`
5. [x] **gateway** - `clawflow gateway start`

### 二、CLI 命令差异
6. [x] **cron add** - 补齐 `--at`、`--deliver`、`--to`、`--channel`
7. [x] **cron enable** - `clawflow cron enable <job_id> [--disable]`
8. [x] **cron run** - `clawflow cron run <job_id> [--force]`
9. [x] **channels login** - WhatsApp 扫码（封装 bridge start）

### 三、CronService API
10. [x] **enableJob** - `enableJob(jobId, enabled): CronJob | null`

### 四、Config / Provider 路由
11. [x] **getApiKey** - 按 model 选择 provider（已实现 matchProviderByModel）
12. [x] **getApiBase** - 按 model 返回 apiBase
13. [x] **AI SDK 多 provider** - 已用 ai、@ai-sdk/*、@openrouter/ai-sdk-provider 实现
14. [x] **config schema** - zhipu、moonshot 已对齐 nanobot

### 五、架构差异（可选）
15. [x] **多 provider 路由** - LiteLLM 风格或增强现有 loader
16. [x] **Bedrock 支持** - @ai-sdk/amazon-bedrock、config.providers.bedrock、路由

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
- `packages/core/src/bridge/` - WhatsApp WebSocket 桥接（crossws + Baileys）
- `packages/core/src/tools/` - 工具注册、cron、filesystem、message、shell、spawn、web
- `packages/core/src/providers/` - LLM 提供方（ai-sdk 多 provider）、语音转写（transcription / Groq）
- `packages/core/src/cron/` - 定时任务服务
- `packages/core/src/session/` - 会话管理
- `packages/core/src/config/` - 配置加载与 schema
