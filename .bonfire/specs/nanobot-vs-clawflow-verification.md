# 逐行核查：clawflow 与 sources/nanobot 实现对照

**日期**: 2025-02-07
**参考**: `sources/nanobot/nanobot/` (Python) vs `packages/core/src/` (TypeScript)

---

## 约定：排除名称，其余差异全部解决

**以下所有“待解决”项将在后续实现中全部补齐。**
**不修改项（仅名称/品牌差异）**：产品名、目录名（如 `.nanobot` vs `.clawflow`）、CLI 名、identity 文案中的品牌、字段命名风格（snake_case vs camelCase）等——保持 clawflow 现有命名与品牌。

---

## 待解决差异清单（将全部解决）

| # | 模块 | 差异说明 | 解决方式 |
|---|------|----------|----------|
| 1 | Context | 用户消息无 **media**（图片）支持 | buildMessages 增加 `media?: string[]`，实现 _build_user_content 等价（base64 image_url + text） |
| 2 | Context | 无渐进式 skills：无 always_skills 全文、无“用 read_file 加载”的 skills 段 | buildSystemPrompt 中：getAlwaysSkills() + loadSkillsForContext(always) 作 Active Skills；skillsSummary 段说明用 read_file 按需加载 |
| 3 | Loop | processMessage 未把 msg.media 传入 buildMessages | 调用 buildMessages 时传入 `media: msg.media ?? undefined` |
| 4 | Memory | 无 append_today | 实现 appendToday(content) |
| 5 | Memory | 无 get_recent_memories(days) | 实现 getRecentMemories(days) |
| 6 | Memory | 无 list_memory_files | 实现 listMemoryFiles() |
| 7 | Skills | 仅 workspace，无 builtin 目录 | 支持可选 builtin 目录（如包内 skills/），listSkills/loadSkill 先 workspace 再 builtin |
| 8 | Skills | build_skills_summary 无 available/description/requires | 从 frontmatter 读 description、nanobot.requires、检查 bins/env 得 available，输出 requires 缺失时 |
| 9 | Skills | get_always_skills 恒 [] | 从 skill metadata 读 always，且满足 requirements 时加入 |
| 10 | Skills | load_skills_for_context 恒 '' | 加载指定 skill 全文并 strip frontmatter，拼成 Active Skills 内容 |
| 11 | Skills | 无 get_skill_metadata / _strip_frontmatter / _check_requirements | 实现 getSkillMetadata、stripFrontmatter、checkRequirements（bins + env） |
| 12 | Subagent | 异常时不向主 agent 宣布 | runSubagent 外 try/catch，失败时 publishInbound 与 nanobot 同格式（status=error、failed） |
| 13 | Tool registry | execute 前无参数校验 | 在 execute 前调用 tool.validateParams（若有），不合格返回错误文案 |
| 14 | Tool base | 无 validate_params | 实现 validateParams(params)，按 JSON Schema 校验，返回 string[] 错误 |
| 15 | Tool registry | 无 unregister / has / tool_names | 实现 unregister(name)、has(name)、get toolNames() |
| 16 | Session | 无 delete(key) | 实现 delete(key)：清 cache、删文件 |
| 17 | Session | 无 list_sessions() | 实现 listSessions()：遍历 sessionsDir *.jsonl，读 metadata 行，按 updated_at 倒序 |
| 18 | Session | 无 Session.clear() | 实现 clear(session)：清 session.messages、更新 updatedAt |
| 19 | Cron | addJob 无 deleteAfterRun | addJob opts 增加 deleteAfterRun?，写入 job 并持久化 |
| 20 | Cron | CLI cron add 无 --delete-after-run | 增加参数并传入 addJob |
| 21 | Config loader | 无 _migrate_config | loadConfig 后执行 migrateConfig（如 tools.exec.restrictToWorkspace → tools.restrictToWorkspace） |
| 22 | Utils | 无 truncate_string | 实现 truncateString(s, maxLen?, suffix?) |
| 23 | Utils | 无 parse_session_key | 实现 parseSessionKey(key): [channel, chatId] |
| 24 | Utils | 无 get_skills_path | 实现 getSkillsPath(workspace?) |

---

## 1. Agent 模块

### 1.1 context (ContextBuilder)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| BOOTSTRAP_FILES | AGENTS.md, SOUL.md, USER.md, TOOLS.md, IDENTITY.md | 同左 | ✓ |
| build_system_prompt | 含 _get_identity()、bootstrap、memory、**always_skills 全文**、**skills_summary（渐进加载）** | 仅 identity 简版、bootstrap、memory、skillsSummary | **缺：渐进式 skill（always 全文 + summary 说明用 read_file 加载）** |
| build_messages | 支持 **media**（图片路径→base64 image_url）、channel、chat_id | 无 media 参数，仅 text | **缺：用户消息中的 media/图片附件** |
| _build_user_content | 将 media 路径转 base64，返回 image_url + text 多 part | 无 | **缺** |
| add_tool_result / add_assistant_message | 返回新 list（不可变风格） | 原地 push（void） | 实现风格不同，功能等价 ✓ |
| Identity 文案 | 完整 nanobot 身份、Runtime、Workspace 路径、IMPORTANT 说明 | ClawFlow 简版、getRuntimeInfo() | 可接受（品牌差异） |

**建议补齐**:
- `buildMessages` 增加 `media?: string[]`，实现 _build_user_content 等价逻辑（base64 图片）。
- `buildSystemPrompt` 中增加：`getAlwaysSkills()` + `loadSkillsForContext(always)` 作为 “Active Skills”，再追加 “Skills” 段（说明用 read_file 按需加载）；clawflow 的 `getAlwaysSkills()` 当前恒返回 `[]`，`loadSkillsForContext` 恒返回 `''`。

---

### 1.2 loop (AgentLoop)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| 构造 | bus, provider, workspace, model, max_iterations, brave_api_key, **exec_config**, cron_service, restrict_to_workspace | 同（execTimeout 代替 exec_config） | ✓ |
| SubagentManager | 在 loop 内创建，传入 provider/workspace/bus/model/brave_api_key/exec_config/restrict | **外部注入** subagentManager（可选） | 设计不同，功能等价 ✓ |
| _register_default_tools | 同组：read/write/edit/listdir, exec, web_search, web_fetch, message, spawn, cron | 同 | ✓ |
| run() | asyncio.wait_for(bus.consume_inbound(), timeout=1.0)，处理/发 outbound | Promise.race(consumeInbound, 1s timeout) | ✓ |
| _process_message | session.get_history()，**build_messages(..., media=msg.media)**，tool context 更新 | getHistory(session)，buildMessages（**无 media**），setToolContext | **缺：media 传入 buildMessages** |
| process_direct | 同 | processDirect 同 | ✓ |
| system 消息 | origin_channel/chat_id 解析，会话与 tool context 用 origin | 同 | ✓ |

**建议**: 与 context 一致，在 processMessage 中把 `msg.media` 传入 `buildMessages`。

---

### 1.3 memory (MemoryStore)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| get_today_file / read_today / read_long_term / write_long_term | ✓ | getTodayFile, readToday, readLongTerm, writeLongTerm | ✓ |
| get_memory_context | Long-term + Today's Notes | 同 | ✓ |
| append_today | 追加今日笔记，无则写 header | **无** | **缺** |
| get_recent_memories(days) | 最近 N 天 YYYY-MM-DD.md 合并 | **无** | **缺** |
| list_memory_files | 列出 memory/*.md 按日期倒序 | **无** | **缺** |

---

### 1.4 skills (SkillsLoader)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| list_skills | workspace + **builtin** 目录，filter_unavailable 可选 | 仅 **workspace** skills | **缺：builtin skills 目录** |
| load_skill | workspace 优先再 builtin | 仅 workspace | **缺：builtin** |
| build_skills_summary | XML，含 **available**、**description**、**requires（缺失时）** | XML，available 恒 true，description 用 name | **缺：skill 元数据、requires、available 检测** |
| get_always_skills | 从 metadata/nanobot 读 always，且满足 requirements | 恒返回 [] | **缺** |
| load_skills_for_context | 加载多 skill 全文并 strip frontmatter | 恒返回 '' | **缺** |
| get_skill_metadata / _parse_nanobot_metadata | YAML frontmatter + nanobot JSON | **无** | **缺** |
| _check_requirements | bins + env | **无** | **缺** |
| _strip_frontmatter | 去 ---...--- | **无** | **缺** |

**说明**: nanobot 有 `BUILTIN_SKILLS_DIR = Path(__file__).parent.parent / "skills"`，clawflow 无内置 skills 目录；若不做“内置 skill 包”，可只补 workspace 内的 metadata/always/requirements。

---

### 1.5 subagent (SubagentManager)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| spawn | 创建 asyncio task，返回说明文案 | setImmediate 跑 runSubagent，返回说明文案 | ✓ |
| _run_subagent | 仅 file/shell/web 工具，无 message/spawn | 同 | ✓ |
| 完成时 | _announce_result(..., status="ok") | announce 成功结果 | ✓ |
| **异常时** | **except → _announce_result(..., status="error")** | **无 try/catch，异常未回传** | **缺：失败时向主 agent 宣布 error** |

**建议**: 在 `runSubagent` 外包裹 try/catch，失败时用与 nanobot 相同的 announce 格式（含 "failed" / error 信息）调用 `publishInbound`。

---

### 1.6 tools

#### registry

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| register / get / get_definitions / execute | ✓ | ✓ | ✓ |
| unregister(name) | ✓ | **无** | 可选 |
| has(name) / tool_names / __len__ | ✓ | **无** | 可选 |
| execute 前 | **validate_params**，不合格返回错误文案 | 直接 execute | **缺：参数校验** |

#### base (Tool)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| name, description, parameters, execute | ✓ | ✓ | ✓ |
| validate_params | 按 JSON Schema 校验，返回 list[str] 错误 | **无** | **缺** |
| to_schema | 同 getDefinitions 结构 | toolToSchema | ✓ |

#### cron-tool

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| action add/list/remove | ✓ | ✓ | ✓ |
| add: deliver=True, channel, to | ✓ | ✓ | ✓ |
| 仅 every_seconds 或 cron_expr | ✓ | ✓ | ✓ |
| **at 定时（一次）** | **cron 层有 at，tool 未暴露** | **tool 未暴露 at** | 一致 |

#### message

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| set_context / execute content, channel, chat_id | ✓ | ✓ | ✓ |
| set_send_callback | ✓ | 构造时传入，无 setter | 可接受 |

其他 tool（filesystem, shell, web, spawn）未逐行列；逻辑对照后与 nanobot 一致，仅命名/风格不同。

---

## 2. Bus

### events

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| InboundMessage | channel, sender_id, chat_id, content, timestamp, **media**, metadata | channel, senderId, chatId, content, timestamp?, media?, metadata? | ✓（media 已有，context 未用） |
| session_key | @property channel:chat_id | getSessionKey(msg) | ✓ |
| OutboundMessage | channel, chat_id, content, reply_to, media, metadata | channel, chatId, content, replyTo?, media?, metadata? | ✓ |

### queue (MessageBus)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| publish/consume inbound/outbound | asyncio.Queue | 数组 + resolve 唤醒 | ✓ |
| subscribe_outbound(channel, callback) | ✓ | subscribeOutbound | ✓ |
| dispatch_outbound | 循环 get(timeout=1)，按 channel 回调 | 同 | ✓ |
| inbound_size / outbound_size | qsize() | length | ✓ |

---

## 3. Config

### loader

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| 路径 | ~/.nanobot/config.json | ~/.clawflow/config.json | 产品差异 ✓ |
| load / save | json + **convert_keys** (camel→snake), **_migrate_config** | defu + defaultConfig，无迁移 | **缺：_migrate_config（如 tools.exec.restrictToWorkspace→tools）** |
| get_api_key / get_api_base | 按 model 匹配 + 回退顺序 | matchProviderByModel + getApiKey/getApiBase | ✓（clawflow 已含 bedrock 等） |

### schema

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| agents, channels, providers, gateway, tools | ✓ | ✓ + **heartbeat, bridge** | clawflow 多两项 ✓ |
| ProviderConfig | api_key, api_base | apiKey, apiBase + **BedrockProviderConfig** | ✓ |
| channels (whatsapp, telegram, discord, feishu) | ✓ | ✓ | ✓ |
| tools.exec.timeout, restrict_to_workspace | ✓ | exec.timeout, restrictToWorkspace | ✓ |
| **nanobot** | **无 bedrock** | **bedrock** | 已对齐 ✓ |

---

## 4. Cron

### types

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| CronSchedule (at, every, cron) | ✓ | ✓ | ✓ |
| CronPayload (deliver, channel, to) | ✓ | ✓ | ✓ |
| CronJobState, CronJob, CronStore | ✓ | ✓ | ✓ |
| delete_after_run | ✓ | deleteAfterRun? | ✓ |

### service

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| start/stop, _load_store, _save_store | ✓ | ✓ | ✓ |
| _recompute_next_runs, _get_next_wake_ms, _arm_timer, _on_timer | ✓ | ✓（armTimer 用 setTimeout） | ✓ |
| list_jobs(include_disabled) | ✓ | listJobs | ✓ |
| add_job(..., **delete_after_run**) | ✓ | addJob(..., opts) **无 deleteAfterRun** | **缺：cron add --delete-after-run 与 addJob 参数** |
| remove_job, enable_job, run_job | ✓ | removeJob, enableJob, runJob | ✓ |
| _execute_job 对 at + delete_after_run | 删 job 或 disable | 同 | ✓（addJob 未暴露 deleteAfterRun） |

---

## 5. Heartbeat

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| HEARTBEAT_PROMPT / HEARTBEAT_OK | ✓ | ✓ | ✓ |
| _is_heartbeat_empty | 跳过空行、标题、注释、checkbox | 同 | ✓ |
| start/stop, _run_loop, _tick | asyncio.create_task(sleep 循环) | setTimeout 链 | ✓ |
| trigger_now | ✓ | triggerNow | ✓ |

---

## 6. Session

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| get_or_create, _load, save | ✓ | getOrCreate, load, save | ✓ |
| add_message | session.add_message(role, content) | addMessage(session, role, content) | ✓ |
| get_history(max_messages) | session.get_history() | getHistory(session, maxMessages) | ✓ |
| 存储路径 | ~/.nanobot/sessions | getSessionsPath() → .clawflow/sessions | ✓ |
| JSONL 格式（_type: metadata + messages） | ✓ | ✓ | ✓ |
| **delete(key)** | ✓ | **无** | **缺** |
| **list_sessions()** | ✓ | **无** | **缺** |
| **Session.clear()** | ✓ | **无** | **缺** |

---

## 7. Utils (helpers)

| 项目 | nanobot | clawflow | 差异 |
|------|---------|----------|------|
| ensure_dir, get_data_path, get_workspace_path | ✓ | ensureDir, getDataPath, getWorkspacePath | ✓ |
| get_sessions_path, get_memory_path, get_skills_path | ✓ | getSessionsPath, getMemoryPath | **缺：getSkillsPath**（若需与 nanobot 一致可加） |
| today_date, timestamp, safe_filename | ✓ | todayDate, timestamp, safeFilename | ✓ |
| **truncate_string** | ✓ | **无** | **缺** |
| **parse_session_key** | ✓ | **无** | **缺** |
| get_config_path, get_cron_store_path | 在 config/loader 或分散 | getConfigPath, getCronStorePath | ✓ |
| get_runtime_info | 内联在 context | getRuntimeInfo() | ✓ |

---

## 8. Channels / CLI / Providers / Bridge

- **Channels**: 两边均为 telegram、discord、feishu、whatsapp；clawflow 多 index 导出，逻辑对齐。
- **CLI**: onboard, agent, status, cron list/add/remove/enable/run, channels status/login, bridge start, gateway start 已对齐；cron add 缺 **--delete-after-run**。
- **Providers**: nanobot 为 LiteLLM，clawflow 为 AI SDK 多 provider；接口 get_api_key/get_api_base 已对齐，Bedrock 等已支持。
- **Bridge**: nanobot 为 ws，clawflow 为 crossws + Baileys；协议与职责一致。

---

## 9. 汇总：建议补齐项（按优先级）

1. **高**
   - **Context + Loop**: 用户消息 **media（图片）** 支持：buildMessages(media)、_build_user_content 等价。
   - **Subagent**: 失败时 **announce error** 到主 agent（与 nanobot _announce_result(status="error") 一致）。
   - **Skills**: 若要做渐进加载，补 **getAlwaysSkills / loadSkillsForContext**、builtin 目录或至少 workspace 内 metadata/requires/available。

2. **中**
   - **Memory**: **append_today**、**get_recent_memories(days)**、**list_memory_files**。
   - **Session**: **delete(key)**、**list_sessions()**、**Session.clear()**（若需管理会话）。
   - **Cron**: **addJob(..., deleteAfterRun)** 与 CLI **cron add --delete-after-run**。

3. **低**
   - **Config**: **_migrate_config**（如旧 config 中 tools.exec.restrictToWorkspace 迁移到 tools.restrictToWorkspace）。
   - **Tool registry**: **validate_params** 在 execute 前调用（或各 tool 内校验）；**unregister / has / tool_names** 视需求添加。
   - **Utils**: **truncate_string**、**parse_session_key**、**getSkillsPath**（若统一路径约定）。

---

**核查结论**: 核心流程（agent loop、bus、cron、heartbeat、gateway、bridge、channels、config/provider 路由）已与 nanobot 对齐。
**下一步**: 上文「待解决差异清单」中 1–24 项将**全部实现**（仅名称/品牌保持 clawflow 现有）。实现完成后，行为与 nanobot 逐行对齐（除命名与品牌外）。
