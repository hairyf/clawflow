---
source: https://github.com/HKUDS/nanobot
title: Memory 记忆
category: features
---

# Memory：持久化记忆

MemoryStore 提供「今日笔记」与「长期记忆」，供 ContextBuilder 注入到 system prompt。

## 路径约定

- Workspace 下 `memory/` 目录
- 长期记忆：`memory/MEMORY.md`
- 每日笔记：`memory/YYYY-MM-DD.md`

## API

```python
store = MemoryStore(workspace)

# 今日
store.get_today_file()       # Path
store.read_today()           # str
store.append_today(content)  # 追加

# 长期
store.read_long_term()
store.write_long_term(content)

# 最近 N 天
store.get_recent_memories(days=7)
store.list_memory_files()   # 所有 YYYY-MM-DD.md，按日期倒序

# 给 Agent 的汇总（ContextBuilder 用）
store.get_memory_context()   # "## Long-term Memory\n..." + "## Today's Notes\n..."
```

## 在 Agent 中的用法

- 系统提示里会包含 `get_memory_context()`，Agent 可被指示「重要信息写入 `memory/MEMORY.md`」。
- 每日笔记用于按日记录，便于回顾最近几天（`get_recent_memories`）。

## 参考

- 源码: `nanobot/agent/memory.py`
- 模板: `workspace/memory/MEMORY.md`
