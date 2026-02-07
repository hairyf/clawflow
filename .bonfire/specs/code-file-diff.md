# 代码文件差异表

**nanobot**: `sources/nanobot/nanobot/` (Python)
**nanobot-pm**: `packages/nanobot-pm/src/` (TypeScript)

以下仅列出**有差异**的项；未列出的文件/API 视为命名或风格差异（snake_case ↔ camelCase），行为对齐。

---

## agent/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| context | 返回值风格 | `add_tool_result` / `add_assistant_message` 返回新 list | 无返回值，原地 push（调用方已适配） |
| context | 构造注入 | 仅 `workspace` | `constructor(workspace, skills?)` 可选注入 SkillsLoader |
| context | Identity 文案 | nanobot 品牌、完整 IMPORTANT 说明 | Nanobot PM 品牌、精简说明 |
| context | 图片 MIME | `mimetypes.guess_type(path)` | 扩展名表 `IMAGE_MIME[extname(path)]` |
| loop | Subagent 创建 | 在 loop 内建 SubagentManager | 外部可选注入 `subagentManager` |
| loop | 构造参数 | `exec_config: ExecToolConfig` | `execTimeout: number` |
| loop | session_key | `msg.session_key` 属性 | `getSessionKey(msg)` 函数 |
| memory | list 返回值 | `list_memory_files()` → `list[Path]` | `listMemoryFiles()` → `string[]` |
| skills | 内置目录 | `BUILTIN_SKILLS_DIR` 相对本文件 | `getDefaultBuiltinSkillsDir()` 查 dist/ 或 ../../skills |
| skills | which | `shutil.which(b)` | `whichSync(b)`（where/which 命令） |
| subagent | 运行方式 | `asyncio.create_task(_run_subagent)` | `setImmediate` + Promise（无 task 句柄） |
| tools/base | 校验入口 | 类方法 `tool.validate_params(params)` | 可选 `tool.validateParams` 或 `validateToolParams(schema, params)` |
| tools/* | 形态 | 类实例（ReadFileTool(allowed_dir=...)） | 工厂函数（readFileTool(allowedDir)） |

---

## bus/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| events | session_key | `InboundMessage.session_key` 属性 | 无属性，`getSessionKey(msg)` 函数 |
| events | 字段名 | snake_case（channel, chat_id, sender_id） | camelCase（channel, chatId, senderId） |

---

## session/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| manager | Session 形态 | 独立 dataclass `Session`，`session.add_message` | 普通接口 `Session`，`manager.addMessage(session, ...)` |
| manager | clear() | 仅清内存，不写盘 | 清内存后调用 `save(session)` |
| manager | list 字段名 | created_at, updated_at | createdAt, updatedAt（SessionListItem） |
| manager | 存储根目录 | `Path.home() / ".nanobot" / "sessions"` | `getSessionsPath()` → `.nanobot-pm/sessions` |

---

## config/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| loader | 键风格 | load 时 `convert_keys` 转 snake_case 给 Pydantic | 不转换，直接 camelCase + defu |
| loader | get_data_dir | 有 | 无（需用 getDataPath） |
| schema | 实现 | Pydantic BaseModel | TypeScript interface + defaultConfig 对象 |
| schema | 额外 | — | BedrockProviderConfig、BridgeConfig、HeartbeatConfig 等 |

---

## cron/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| service | 定时器 | asyncio.create_task(sleep) 链 | setTimeout 链 |
| service | 字段名 | snake_case（next_run_at_ms） | camelCase（nextRunAtMs） |
| types | 形态 | dataclass | interface |

---

## providers/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| litellm_provider ↔ ai-sdk | 实现 | LiteLLM 统一入口 | @ai-sdk/* 多 provider、matchProviderByModel |
| base | 形态 | 抽象类 ABC | interface + 类型定义 |

---

## utils/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| helpers | 路径类型 | Path 对象 | string |
| helpers | get_config_path | 在 config/loader | 在 helpers：getConfigPath() |
| helpers | 额外 | — | getCronStorePath(), getRuntimeInfo() |

---

## channels/

| 文件对 | 差异项 | nanobot | nanobot-pm |
|--------|--------|---------|----------|
| * | 形态 | 类继承 BaseChannel | 类继承 BaseChannel，另有 index 统一导出 |

---

## nanobot-pm 独有（nanobot 无对应文件）

| nanobot-pm | 说明 |
|----------|------|
| agent/context.test.ts | 单测 |
| channels/index.ts | 类型/导出汇总 |
| bridge/* | crossws + Baileys 桥接 |
| gateway/index.ts | 网关控制器 |
| index.ts | 包顶层导出 |
| config/schema | Bedrock、Bridge、Heartbeat 等配置项 |

---

## nanobot 独有（nanobot-pm 无对应）

| nanobot | 说明 |
|---------|------|
| config/loader | convert_keys, convert_to_camel, camel_to_snake, snake_to_camel | nanobot-pm 不做键转换 |
| utils/helpers | get_data_path 对应 nanobot-pm getDataPath；无 get_config_path（在 config 中） |

---

## 汇总

- **命名/风格**：snake_case ↔ camelCase、Path ↔ string、dataclass/ABC ↔ interface/工厂函数，属约定差异，不视为功能差异。
- **行为差异**：Session.clear 是否立即持久化；context 的 add_* 是否返回新 list。
- **实现差异**：LLM 用 LiteLLM vs AI SDK；subagent 用 asyncio task vs setImmediate；cron 用 asyncio vs setTimeout。
- **缺失**：nanobot-pm 无 config 的 convert_keys/convert_to_camel（无需，TS 用 camelCase）；nanobot 无 getRuntimeInfo（在 identity 内联）。
