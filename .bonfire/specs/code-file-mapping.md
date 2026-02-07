# 代码文件对照表

**nanobot**: `sources/nanobot/nanobot/` (Python)
**clawflow**: `packages/core/src/` (TypeScript)

---

## 对照表

| nanobot | clawflow | 说明 |
|---------|----------|------|
| **agent/** | **agent/** | |
| agent/context.py | agent/context.ts | ContextBuilder |
| agent/loop.py | agent/loop.ts | AgentLoop |
| agent/memory.py | agent/memory.ts | MemoryStore |
| agent/skills.py | agent/skills.ts | SkillsLoader |
| agent/subagent.py | agent/subagent.ts | SubagentManager |
| agent/tools/base.py | agent/tools/base.ts | Tool 接口、validateToolParams、toolToSchema |
| agent/tools/registry.py | agent/tools/registry.ts | ToolRegistry |
| agent/tools/cron.py | agent/tools/cron-tool.ts | CronTool |
| agent/tools/filesystem.py | agent/tools/filesystem.ts | read/write/edit/listdir |
| agent/tools/shell.py | agent/tools/shell.ts | exec |
| agent/tools/message.py | agent/tools/message.ts | message |
| agent/tools/spawn.py | agent/tools/spawn.ts | spawn |
| agent/tools/web.py | agent/tools/web.ts | web_search, web_fetch |
| — | agent/context.test.ts | 单测（clawflow 独有） |
| **bus/** | **bus/** | |
| bus/events.py | bus/events.ts | InboundMessage, OutboundMessage, getSessionKey |
| bus/queue.py | bus/queue.ts | MessageBus |
| **channels/** | **channels/** | |
| channels/base.py | channels/base.ts | 渠道基类 |
| channels/manager.py | channels/manager.ts | ChannelManager |
| channels/telegram.py | channels/telegram.ts | Telegram |
| channels/discord.py | channels/discord.ts | Discord |
| channels/feishu.py | channels/feishu.ts | Feishu |
| channels/whatsapp.py | channels/whatsapp.ts | WhatsApp |
| — | channels/index.ts | 统一导出（clawflow 独有） |
| **cli/** | **cli/** | |
| cli/commands.py | cli/index.ts | CLI 入口与子命令 |
| **config/** | **config/** | |
| config/loader.py | config/loader.ts | loadConfig, saveConfig, migrateConfig |
| config/schema.py | config/schema.ts | 配置类型/默认值 |
| **cron/** | **cron/** | |
| cron/types.py | cron/types.ts | CronJob, CronSchedule, CronStore 等 |
| cron/service.py | cron/service.ts | CronService |
| **heartbeat/** | **heartbeat/** | |
| heartbeat/service.py | heartbeat/service.ts + heartbeat/index.ts | HeartbeatService |
| **providers/** | **providers/** | |
| providers/base.py | providers/base.ts | LLMProvider 接口等 |
| providers/litellm_provider.py | providers/ai-sdk.ts | LLM 调用（nanobot 用 LiteLLM，clawflow 用 AI SDK） |
| providers/transcription.py | providers/transcription.ts | 语音转写 |
| **session/** | **session/** | |
| session/manager.py | session/manager.ts | SessionManager, Session, SessionListItem |
| **utils/** | **utils/** | |
| utils/helpers.py | utils/helpers.ts | ensureDir, get*Path, todayDate, truncateString, parseSessionKey 等 |
| **—** | **bridge/** | crossws + Baileys（clawflow 独有） |
| — | bridge/index.ts | |
| — | bridge/server.ts | |
| — | bridge/types.ts | |
| — | bridge/whatsapp.ts | |
| **—** | **gateway/** | 网关模式（clawflow 独有） |
| — | gateway/index.ts | |
| **—** | **index.ts** | 包入口（clawflow 根级） |
| **—** | **skills/** | 内置 SKILL.md 内容目录（非 nanobot 代码对应） |

---

## 说明

- 未列出 `__init__.py` / `__main__.py`；clawflow 无一一对应的包初始化文件。
- 命名差异：nanobot 多为 `snake_case` 文件/模块，clawflow 为 `camelCase` 或 `kebab-case`（如 `cron-tool.ts`）。
- **providers**：nanobot 使用 LiteLLM，clawflow 使用 `@ai-sdk/*` 等，接口通过 `providers/base` 对齐。
- **bridge / gateway**：clawflow 额外模块，无 nanobot 同名模块。
- **skills/**：clawflow 下为内置技能 Markdown 与脚本，对应 nanobot 仓库中的 `skills/` 目录内容，非 Python 源码对照。
