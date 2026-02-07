---
specs: .bonfire/specs/
docs: .bonfire/docs/
git: commit-all
linear: false
---

# Session Context: nanobot-pm

**Date**: 2025-02-07
**Status**: Ended
**Branch**: main

---

## Current State

nanobot-pm 是一个基于 nanobot 架构的 TypeScript/Node.js AI 代理框架，采用 monorepo 结构。当前实现包括：

- **packages/nanobot-pm**: 核心包，包含 agent loop、bus、tools、cron、providers、session、config 等模块
- **skills/nanobot**: 从 nanobot Python 项目提取的技能参考
- **sources/nanobot**: 原始 nanobot Python 源码

---

## Recent Sessions

- **2025-02-07** (本会话): **CLI 与 nanobot 源码对齐** — onboard：模板（AGENTS/SOUL/USER、MEMORY）与 nanobot 一致，config 覆盖确认（@clack confirm）、Next steps 分步输出；agent：Bedrock 免 API key、交互模式 Ctrl+C 输出 Goodbye!；status：详细 API（OpenRouter/Anthropic/OpenAI/Gemini/vLLM）；channels status：Configuration 列（bridgeUrl、gatewayUrl、token 脱敏）；cron list：--all 默认排除 disabled、表格 + Next Run；cron remove：Removed job {id}；gateway：--verbose、Bedrock 检查。test/build 通过。
- **2025-02-07**: **项目重命名为 nanobot-pm** — 包名与 CLI：clawflow → nanobot-pm（根包 nanobot-pm-monorepo，核心包 nanobot-pm，bin nanobot-pm）；类型 ClawflowConfig → NanobotPmConfig；数据目录 ~/.clawflow → ~/.nanobot-pm；用户面向文案与品牌改为 Nanobot PM；更新 package.json、AGENTS.md、.bonfire、specs、测试注释与临时目录前缀；pnpm install / test / build 通过。
- **2025-02-07**: **snake_case 命名统一 + 文件命名对齐 + AGENTS.md 约束** — 创建 `scripts/snake-case-rename.mjs` 批量重命名 591 处（方法/函数/属性）为 snake_case；`cron-tool.ts` → `cron.ts`、`cron-tool.test.ts` → `cron.test.ts` 与 nanobot 对齐；新增 `.bonfire/specs/snake-case-rename-map.md`、`code-file-naming-diff.md`；根目录 AGENTS.md 增加 AI 约束（naming、file structure、syncing with nanobot）；修复 gateway 中 `../heartbeat/service` → `../heartbeat`。
- **2025-02-07**: **packages/nanobot-pm test/ nanobot a/b 对照单元测试** — 新建 `test/` 目录，vitest 包含 `test/**/*.test.ts`；新增 base、registry、helpers、bus/events、bus/queue、agent/context、memory、skills、session、cron、config、subagent、tools（filesystem、cron-tool、message、shell、web）共 19 个测试文件、114 用例；shell/web 使用 vi.mock/vi.hoisted 模拟 exec、ofetch；loader getApiKey/getApiBase 对齐 nanobot _match_provider；SessionManager 增加 `sessionsDir` 可选参数便于测试；覆盖率 72% → 84%（shell 100%、web 96%）。
- **2025-02-07**: **nanobot 对照精简与 get_running_count** — 删除 `nanobot-vs-clawflow-verification.md`、`skills-module-verification.md`；新增 `code-file-mapping.md`、`code-file-diff.md`；修复 loop chat_id 解析；实现 `SubagentManager.getRunningCount()`。
- **2025-02-07**: **Skills 核查与单元测试** — 写 `.bonfire/specs/skills-module-verification.md`；`context.test.ts` 三用例；ContextBuilder 可选 `skills?: SkillsLoader`；vitest/tsdown 排除 `*.test.ts`。
- **2025-02-07**: **任务 19 Skills + 打包携带 skills** — SkillsLoader：builtin 目录、getSkillMetadata/stripFrontmatter/checkRequirements、getAlwaysSkills、loadSkillsForContext；utils 增加 getSkillsPath；build 时 `scripts/copy-skills.mjs` 将 repo `skills/` 复制到 `dist/skills`，打包携带 builtin skills。
- **2025-02-07**: **任务 21 Tool 校验与 registry** — 实现 `validateToolParams`（base.ts，按 JSON Schema 校验）、Tool 可选 `validateParams`、registry execute 前校验、`unregister`/`has`/`toolNames`。
- **2025-02-07**: **任务 22 Session API** — 实现 `SessionManager.delete(key)`、`listSessions()`、`clear(session)` 与 `SessionListItem`；与 nanobot session 对齐。
- **2025-02-07**: **任务 23 Cron deleteAfterRun** — `CronService.addJob` 增加 `opts.deleteAfterRun` 并写入 job、持久化；CLI `cron add` 增加 `--delete-after-run` 并传入 addJob；core 构建通过。
- **2025-02-07**: **任务 18 Memory API** — 实现 `appendToday(content)`、`getRecentMemories(days)`、`listMemoryFiles()`，与 nanobot memory 对齐；core 构建通过。
- **2025-02-07**: **nanobot 逐行核查与待办清单** — 逐项对照 `packages/nanobot-pm/src` 与 `sources/nanobot`；撰写 `.bonfire/specs/nanobot-vs-clawflow-verification.md`，约定排除名称/品牌后**其余差异全部解决**，并列出 24 项待解决清单（Context/media+skills、Loop/media、Memory 三项 API、Skills 渐进加载与 builtin、Subagent 失败回传、Tool 校验与 registry、Session delete/list/clear、Cron deleteAfterRun、Config migrate、Utils 三项）。下一步：按该 spec 逐项实现。
- **2025-02-07**: **CLI 命令差异、enableJob、Bedrock 支持** — 实现 cron add（--at、--deliver、--to、--channel）、cron enable、cron run、channels login；CronService.enableJob API；AWS Bedrock（@ai-sdk/amazon-bedrock、config.providers.bedrock、loader 路由）。Next Priorities 二至五全部完成。
- **2025-02-07**: **AI SDK 与 Provider 对齐** — 更新 ai/@ai-sdk/* 至最新版本；重构 ai-sdk.ts（去除 any、正确类型、ModelMessage 转换）；对齐 nanobot：config 新增 zhipu、moonshot，loader 路由与回退顺序；ai-sdk 支持 Zhipu（zhipu-ai-provider）、Moonshot（createOpenAI + apiBase）、kimi-k2.5 强制 temperature=1.0；移除冗余 openai.ts；关闭 ESLint explicit-function-return-type。
- **2025-02-07**: 实现 **gateway 命令**（gateway/index.ts、CLI `nanobot-pm gateway start`）；启动 channels + heartbeat + cron + agent 的网关模式；任务 5 完成。
- **2025-02-07**: Bonfire start → 实现 **bridge/**（BridgeServer、crossws、Baileys、config.bridge、CLI `nanobot-pm bridge start`）；任务 4 完成。Session ended: 健康检查通过，无断链或孤立 spec/doc。
- **2025-02-07**: 实现 **heartbeat/**（HeartbeatService、config.heartbeat）、**providers/transcription**（GroqTranscriptionProvider、Telegram 语音转写）；任务 2、3 完成
- **2025-02-07**: 实现 **channels/** 模块：base、manager、telegram、discord、feishu、whatsapp；config schema 增加 channels/gateway；CLI 增加 `channels status`
- **2025-02-07**: Bonfire start；完成 nanobot vs nanobot-pm 模块对比，整理未实现模块与实现差异清单，作为待办记入 Next Priorities

---

## Next Session Priorities

### 一、已实现模块
1. [x] **channels/** - base、manager、telegram、discord、feishu、whatsapp
2. [x] **heartbeat/** - HeartbeatService
3. [x] **providers/transcription** - GroqTranscriptionProvider
4. [x] **bridge/** - crossws + Baileys，CLI: `nanobot-pm bridge start`
5. [x] **gateway** - `nanobot-pm gateway start`

### 二、CLI 命令差异
6. [x] **cron add** - 补齐 `--at`、`--deliver`、`--to`、`--channel`
7. [x] **cron enable** - `nanobot-pm cron enable <job_id> [--disable]`
8. [x] **cron run** - `nanobot-pm cron run <job_id> [--force]`
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

### 六、nanobot 逐行对齐（24 项）
对照与差异见 **.bonfire/specs/code-file-mapping.md**、**code-file-diff.md**。摘要：
17. [x] **Context + Loop**: 用户消息 media（图片）、渐进式 skills（always 全文 + summary）；loop 传入 media
18. [x] **Memory**: appendToday、getRecentMemories(days)、listMemoryFiles
19. [x] **Skills**: builtin 目录、metadata/available/requires、getAlwaysSkills、loadSkillsForContext、getSkillMetadata/stripFrontmatter/checkRequirements；打包携带 skills 目录（build 时复制 repo skills → dist/skills）
20. [x] **Subagent**: 失败时 announce error
21. [x] **Tool**: validateParams（base + registry）、unregister/has/toolNames
22. [x] **Session**: delete(key)、listSessions()、clear(session)
23. [x] **Cron**: addJob deleteAfterRun、CLI --delete-after-run
24. [x] **Config**: migrateConfig
25. [x] **Utils**: truncateString、parseSessionKey、getSkillsPath

### 七、单元测试（test/）
26. [x] **nanobot a/b 对照测试** — test/ 目录，shell/web/loader/helpers/context 等 mock 测试，114 用例，覆盖率 84%

### 八、命名与约束
27. [x] **snake_case 统一** — 方法/函数/属性全部改为 snake_case，脚本 `scripts/snake-case-rename.mjs`
28. [x] **文件命名** — agent/tools/cron.ts（与 nanobot cron.py 对齐）
29. [x] **AGENTS.md** — 根目录 AI 约束（naming、file structure、syncing、verification）

### 九、项目重命名
30. [x] **nanobot-pm** — 包名/CLI/类型/数据目录/品牌与文档已从 clawflow 全部切换；test/build 通过。

### 十、CLI 与 nanobot 对照（本会话完成）
31. [x] **onboard / agent / status / channels / cron / gateway** — 模板、覆盖确认、Bedrock、输出格式与 nanobot commands.py 对齐。

**可选后续**：若 GitHub 仓库仍为 `clawflow`，可在 GitHub 上重命名为 `nanobot-pm`，或把 `package.json` 中 homepage/repository/bugs URL 改回 `hairyf/clawflow`。

---

## Key Resources

**Code References**:
- nanobot 文件对照与差异: `.bonfire/specs/code-file-mapping.md`、`.bonfire/specs/code-file-diff.md`
- CLI 入口: `packages/nanobot-pm/src/cli/index.ts`
- Agent 主循环: `packages/nanobot-pm/src/agent/loop.ts`
- Cron 服务: `packages/nanobot-pm/src/cron/service.ts`
- 配置加载: `packages/nanobot-pm/src/config/loader.ts`

**External Links**:
- [GitHub Repository](https://github.com/hairyf/nanobot-pm)
- [nanobot skill](skills/nanobot/SKILL.md)

---

## Codemap

**Entry Points**:
- `pnpm start` / `nanobot-pm` → `packages/nanobot-pm/bin/index.mjs`
- CLI: `packages/nanobot-pm/src/cli/index.ts`

**Core Components**:
- `packages/nanobot-pm/src/agent/` - 代理循环、上下文、记忆、技能、子代理
- `packages/nanobot-pm/src/bus/` - 事件总线、队列
- `packages/nanobot-pm/src/channels/` - 聊天渠道（base、manager、telegram、discord、feishu、whatsapp）
- `packages/nanobot-pm/src/heartbeat/` - 定时读 HEARTBEAT.md 唤醒 agent（HeartbeatService）
- `packages/nanobot-pm/src/bridge/` - WhatsApp WebSocket 桥接（crossws + Baileys）
- `packages/nanobot-pm/src/tools/` - 工具注册、cron、filesystem、message、shell、spawn、web
- `packages/nanobot-pm/src/providers/` - LLM 提供方（ai-sdk 多 provider）、语音转写（transcription / Groq）
- `packages/nanobot-pm/src/cron/` - 定时任务服务
- `packages/nanobot-pm/src/session/` - 会话管理
- `packages/nanobot-pm/src/config/` - 配置加载与 schema
