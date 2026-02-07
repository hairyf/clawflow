# 文件命名对照表

**nanobot**: `sources/nanobot/nanobot/` (Python，snake_case)
**nanobot-pm**: `packages/core/src/` (TypeScript)

---

## 一、一一对应（命名风格不同）

| nanobot | nanobot-pm | 差异 |
|---------|----------|------|
| agent/tools/cron.py | agent/tools/cron.ts | 一致 |
| providers/litellm_provider.py | providers/ai-sdk.ts | `litellm_provider` vs `ai-sdk`（实现不同） |
| cli/commands.py | cli/index.ts | `commands` vs `index`（入口习惯） |
| heartbeat/service.py | heartbeat/service.ts | 一致；nanobot-pm 多 index.ts 导出 |

---

## 二、命名一致

| 路径 | 说明 |
|------|------|
| agent/context | context.ts |
| agent/loop | loop.ts |
| agent/memory | memory.ts |
| agent/skills | skills.ts |
| agent/subagent | subagent.ts |
| agent/tools/base | base.ts |
| agent/tools/filesystem | filesystem.ts |
| agent/tools/message | message.ts |
| agent/tools/registry | registry.ts |
| agent/tools/shell | shell.ts |
| agent/tools/spawn | spawn.ts |
| agent/tools/web | web.ts |
| bus/events | events.ts |
| bus/queue | queue.ts |
| channels/base | base.ts |
| channels/discord | discord.ts |
| channels/feishu | feishu.ts |
| channels/manager | manager.ts |
| channels/telegram | telegram.ts |
| channels/whatsapp | whatsapp.ts |
| config/loader | loader.ts |
| config/schema | schema.ts |
| cron/service | service.ts |
| cron/types | types.ts |
| providers/base | base.ts |
| providers/transcription | transcription.ts |
| session/manager | manager.ts |
| utils/helpers | helpers.ts |

---

## 三、nanobot-pm 独有

| nanobot-pm | 说明 |
|----------|------|
| agent/*.test.ts | 单元测试 |
| channels/index.ts | 统一导出 |
| bridge/* | 桥接模块 |
| gateway/index.ts | 网关 |
| index.ts | 包根入口 |
| skills/* | 内置 SKILL 目录 |

---

## 四、命名风格汇总

| 维度 | nanobot | nanobot-pm |
|------|---------|----------|
| 文件名校验 | snake_case（litellm_provider.py） | kebab-case（ai-sdk.ts）；cron.ts 已与 nanobot 对齐 |
| 模块入口 | __init__.py | index.ts |
| CLI 入口 | commands.py | index.ts |

---

## 五、可选：若需统一 ai-sdk 文件命名

| 当前 | 目标 |
|------|------|
| ai-sdk.ts | ai_sdk.ts |
