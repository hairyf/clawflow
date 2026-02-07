# snake_case 重命名对照表

用于 clawflow → nanobot 命名一致性，自动化重命名时按此表逐项替换。

**注意**：每项替换时需用**整词匹配**，避免误替换子串（如 `addMessage` 不应匹配 `addMessageToQueue`）。

---

## 一、方法 / 函数名

| 当前 (camelCase) | 目标 (snake_case) | 主要文件 |
|------------------|-------------------|----------|
| listMemoryFiles | list_memory_files | memory.ts, memory.test.ts |
| appendToday | append_today | memory.ts, memory.test.ts |
| getRecentMemories | get_recent_memories | memory.ts, memory.test.ts |
| readToday | read_today | memory.ts, memory.test.ts |
| readLongTerm | read_long_term | memory.ts, memory.test.ts |
| writeLongTerm | write_long_term | memory.ts, memory.test.ts |
| getTodayFile | get_today_file | memory.ts, memory.test.ts |
| getMemoryContext | get_memory_context | memory.ts, memory.test.ts, context.ts |
| getSkillMetadata | get_skill_metadata | skills.ts, skills.test.ts |
| getSkillMeta | get_skill_meta | skills.ts, skills.test.ts |
| stripFrontmatter | strip_frontmatter | skills.ts, skills.test.ts |
| checkRequirements | check_requirements | skills.ts |
| getAlwaysSkills | get_always_skills | skills.ts, skills.test.ts, context.ts |
| loadSkillsForContext | load_skills_for_context | skills.ts, skills.test.ts, context.ts |
| getOrCreate | get_or_create | manager.ts, loop.ts, manager.test.ts |
| addMessage | add_message | manager.ts, loop.ts, manager.test.ts |
| listSessions | list_sessions | manager.ts, manager.test.ts |
| validateToolParams | validate_tool_params | base.ts, registry.ts, base.test.ts |
| toolToSchema | tool_to_schema | base.ts, base.test.ts |
| validateParams | validate_params | base.ts (Tool 接口), registry.ts |
| addJob | add_job | service.ts, cli/index.ts, cron-tool.ts, service.test.ts |
| enableJob | enable_job | service.ts, cli/index.ts, service.test.ts |
| listJobs | list_jobs | service.ts, cli/index.ts, cron-tool.ts, gateway/index.ts, service.test.ts |
| matchProviderByModel | match_provider_by_model | loader.ts (内部) |
| migrateConfig | migrate_config | loader.ts, loader.test.ts |
| loadConfig | load_config | loader.ts, cli/index.ts, loader.test.ts |
| saveConfig | save_config | loader.ts, cli/index.ts, loader.test.ts |
| getWorkspacePathFromConfig | get_workspace_path_from_config | loader.ts, cli/index.ts, gateway/index.ts, loader.test.ts |
| getApiKey | get_api_key | loader.ts, cli/index.ts, gateway/index.ts, loader.test.ts |
| getApiBase | get_api_base | loader.ts, loader.test.ts |
| getDataPath | get_data_path | helpers.ts |
| getConfigPath | get_config_path | helpers.ts, loader.ts, cli/index.ts |
| getWorkspacePath | get_workspace_path | helpers.ts, cli/index.ts |
| getSessionsPath | get_sessions_path | helpers.ts, manager.ts |
| getMemoryPath | get_memory_path | helpers.ts |
| getSkillsPath | get_skills_path | helpers.ts |
| getCronStorePath | get_cron_store_path | helpers.ts, cli/index.ts, gateway/index.ts |
| todayDate | today_date | helpers.ts, memory.ts |
| truncateString | truncate_string | helpers.ts, helpers.test.ts |
| parseSessionKey | parse_session_key | helpers.ts, loop.ts, helpers.test.ts |
| getRuntimeInfo | get_runtime_info | helpers.ts, context.ts |
| ensureDir | ensure_dir | helpers.ts, memory.ts, loader.ts 等 |
| safeFilename | safe_filename | helpers.ts, manager.ts |
| buildMessages | build_messages | context.ts, loop.ts, context.test.ts |
| setContext | set_context | message.ts, cron-tool.ts, spawn.ts, loop.ts, 各 test |
| getSessionKey | get_session_key | events.ts |
| createAISDKProvider | create_ai_sdk_provider | ai-sdk.ts, index.ts |
| startGateway | start_gateway | gateway/index.ts, index.ts |
| startBridge | start_bridge | bridge/index.ts, index.ts |

---

## 二、属性 / 字段名

| 当前 (camelCase) | 目标 (snake_case) | 主要文件 |
|------------------|-------------------|----------|
| createdAt | created_at | manager.ts (Session, SessionListItem), manager.test.ts |
| updatedAt | updated_at | manager.ts (Session, SessionListItem), manager.test.ts |
| createdAtMs | created_at_ms | service.ts, types.ts |
| updatedAtMs | updated_at_ms | service.ts, types.ts |
| chatId | chat_id | events.ts, base.ts, loop.ts, subagent.ts, telegram.ts, discord.ts, whatsapp.ts, feishu.ts, message.ts, cron-tool.ts, spawn.ts 及所有 test |
| senderId | sender_id | events.ts, base.ts, loop.ts, subagent.ts, telegram.ts, discord.ts 及 test |
| deleteAfterRun | delete_after_run | service.ts, types.ts, cli/index.ts, cron-tool.ts, service.test.ts |
| nextRunAtMs | next_run_at_ms | service.ts, types.ts |
| everyMs | every_ms | service.ts, types.ts, cli/index.ts, cron-tool.ts, service.test.ts, types.test.ts |
| atMs | at_ms | service.ts, types.ts, cli/index.ts, service.test.ts, types.test.ts |
| allowedDir | allowed_dir | filesystem.ts, loop.ts, subagent.ts, filesystem.test.ts |
| execTimeout | exec_timeout | loop.ts, subagent.ts, cli/index.ts, gateway/index.ts |

---

## 三、私有属性（类内部）

| 当前 | 目标 | 文件 |
|------|------|------|
| memoryDir | memory_dir | memory.ts |
| memoryFile | memory_file | memory.ts |
| sessionsDir | sessions_dir | manager.ts |
| execTimeout (private) | exec_timeout | loop.ts, subagent.ts |

---

## 四、grep 统计（便于校验）

运行以下命令可快速定位各项出现次数（在 packages/core 下）：

```bash
# 方法
rg -c "listMemoryFiles|appendToday|getRecentMemories" packages/core
rg -c "getSkillMetadata|stripFrontmatter|getAlwaysSkills|loadSkillsForContext" packages/core
rg -c "getOrCreate|addMessage|listSessions" packages/core
rg -c "validateToolParams|toolToSchema|validateParams" packages/core
rg -c "addJob|enableJob|listJobs" packages/core
rg -c "getDataPath|getConfigPath|getWorkspacePath|getSessionsPath|getCronStorePath" packages/core
rg -c "todayDate|truncateString|parseSessionKey|getRuntimeInfo|ensureDir|safeFilename" packages/core
rg -c "loadConfig|saveConfig|migrateConfig|getApiKey|getApiBase|matchProviderByModel" packages/core

# 属性
rg -c "createdAt|updatedAt" packages/core
rg -c "chatId|senderId" packages/core
rg -c "deleteAfterRun|nextRunAtMs|everyMs|atMs" packages/core
rg -c "allowedDir|execTimeout" packages/core
```

---

## 五、建议替换顺序

1. **utils/helpers.ts** 的函数（被多处引用，先改）
2. **config/loader.ts** 的函数
3. **agent/memory.ts** 方法
4. **agent/skills.ts** 方法
5. **session/manager.ts** 方法 + 接口字段
6. **cron/** 方法 + 类型字段
7. **agent/tools/** 函数与方法
8. **bus/events.ts** 接口 + getSessionKey
9. **agent/context.ts** buildMessages + options.chatId
10. **agent/loop.ts** 及 channels/bridge/gateway 中的 chatId/senderId

替换后需运行 `pnpm test` 和 `pnpm build` 校验。
