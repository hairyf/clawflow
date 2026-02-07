---
source: https://github.com/HKUDS/nanobot
title: Agent Loop
category: core
---

# Agent Loop：核心处理引擎

AgentLoop 负责：收消息 → 建 context → 调 LLM → 执行 tool calls → 回写响应。

## 初始化

```python
# 典型构造（来自 nanobot 内部）
loop = AgentLoop(
    bus=message_bus,
    provider=llm_provider,
    workspace=Path("~/.nanobot/workspace"),
    model=None,                    # 默认用 provider.get_default_model()
    max_iterations=20,
    brave_api_key=...,
    exec_config=ExecToolConfig(),
    cron_service=cron_service,
    restrict_to_workspace=False,
)
```

## 运行方式

- **异步循环**：`await loop.run()` 从 bus 消费 inbound，处理完后 publish outbound。
- **直接调用**：CLI/Cron 用 `await loop.process_direct(content, session_key, channel, chat_id)` 同步返回回复文本。

## 单条消息处理流程（_process_message）

1. 若 `msg.channel == "system"` → 走系统消息分支（如 subagent 完成通知），`chat_id` 格式为 `origin_channel:origin_chat_id` 用于回源。
2. 否则：`session = sessions.get_or_create(msg.session_key)`，更新 message/spawn/cron 等 tool 的 channel/chat_id。
3. `context.build_messages(history, current_message, ...)` 得到带 system prompt 的 messages。
4. 循环：`provider.chat(messages, tools, model)` → 若有 tool_calls，则执行每个 tool，把 assistant 消息和 tool 结果追加到 messages，继续；否则 `final_content = response.content` 并退出。
5. 将会话写入 session，返回 `OutboundMessage(channel, chat_id, final_content)`。

## 默认注册的 Tools

- 文件：read_file, write_file, edit_file, list_dir（可选 restrict_to_workspace）
- Shell：exec
- Web：web_search, web_fetch
- message、spawn、cron（若提供 cron_service）

## 参考

- 源码: `nanobot/agent/loop.py`
