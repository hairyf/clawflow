---
source: https://github.com/HKUDS/nanobot
title: Tools 基类与注册表
category: core
---

# Agent Tools：基类与 Registry

Tools 是 Agent 可调用的能力（读文件、执行命令、搜索、发消息、spawn、cron 等）。统一抽象为 `Tool` 基类，由 `ToolRegistry` 注册与执行。

## Tool 基类

```python
from nanobot.agent.tools.base import Tool

class Tool(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def description(self) -> str: ...

    @property
    @abstractmethod
    def parameters(self) -> dict[str, Any]: ...  # JSON Schema

    @abstractmethod
    async def execute(self, **kwargs: Any) -> str: ...
```

- `validate_params(params)`：按 JSON Schema 校验，返回错误列表。
- `to_schema()`：转为 OpenAI function 格式 `{ "type": "function", "function": { "name", "description", "parameters" } }`。

## ToolRegistry

```python
registry = ToolRegistry()
registry.register(SomeTool(...))
registry.unregister("name")
tool = registry.get("name")
registry.has("name")
definitions = registry.get_definitions()   # 供 LLM API
result = await registry.execute("name", { "arg": "value" })
```

- `execute` 内部会校验参数，调用 `tool.execute(**params)`，异常时返回 `"Error: ..."` 字符串。

## 内置工具一览（语义）

| 名称         | 说明           |
|--------------|----------------|
| read_file    | 读文件         |
| write_file   | 写文件         |
| edit_file    | 按 old/new 编辑 |
| list_dir     | 列目录         |
| exec         | 执行 shell     |
| web_search   | Brave 搜索     |
| web_fetch    | 抓取 URL       |
| message      | 发到当前 channel/chat |
| spawn        | 后台子 agent   |
| cron         | 定时任务（若启用） |

## 自定义 Tool

1. 继承 `Tool`，实现 `name`、`description`、`parameters`、`execute`。
2. 在 `AgentLoop._register_default_tools()` 或等价处 `self.tools.register(YourTool(...))`。

## 参考

- 源码: `nanobot/agent/tools/base.py`, `nanobot/agent/tools/registry.py`
- 使用说明: `workspace/TOOLS.md`
