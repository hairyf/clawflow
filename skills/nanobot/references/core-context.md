---
source: https://github.com/HKUDS/nanobot
title: Context Builder
category: core
---

# Context 构建：系统提示与消息列表

ContextBuilder 负责把 bootstrap 文件、memory、skills、会话历史组装成发给 LLM 的 system prompt 和 messages。

## Bootstrap 文件

按顺序从 workspace 读取并拼进 system prompt（若存在）：

- `AGENTS.md` — Agent 指令与规范
- `SOUL.md` — 人格与沟通风格
- `USER.md` — 用户画像
- `TOOLS.md` — 工具说明
- `IDENTITY.md` — 可选身份扩展

## 身份与运行时

`_get_identity()` 固定包含：

- 当前时间、运行时（OS、Python 版本）、workspace 路径
- 能力说明：读写文件、执行命令、搜索/抓取网页、发消息、spawn 子任务
- 记忆路径：`workspace/memory/MEMORY.md`、`memory/YYYY-MM-DD.md`、`workspace/skills/{name}/SKILL.md`

## 记忆与 Skills

- **Memory**：`MemoryStore.get_memory_context()` → 长期记忆 + 今日笔记，以 `# Memory` 段加入。
- **Skills**：`always` 的 skill 全文注入；其余仅生成 summary，提示 agent 用 `read_file` 按需加载 SKILL.md。

## 构建消息列表

```python
messages = context.build_messages(
    history=session.get_history(),
    current_message=msg.content,
    skill_names=None,
    media=msg.media,
    channel=msg.channel,
    chat_id=msg.chat_id,
)
# 结构：[{ "role": "system", "content": "..." }, ...history..., { "role": "user", "content": ... }]
```

- 若有 `channel`/`chat_id`，在 system 末尾追加 `## Current Session\nChannel: ...\nChat ID: ...`。
- 支持多模态：`media` 中的图片会 base64 编码为 `image_url`，与文本一起作为 user content。

## 工具轮次中追加消息

- `add_assistant_message(messages, content, tool_calls)` — 追加带 tool_calls 的 assistant 消息。
- `add_tool_result(messages, tool_call_id, tool_name, result)` — 追加 tool 结果（role: tool）。

## 参考

- 源码: `nanobot/agent/context.py`
