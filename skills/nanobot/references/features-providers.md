---
source: https://github.com/HKUDS/nanobot
title: LLM Providers
category: features
---

# LLM Providers

所有 LLM 接入统一实现 `LLMProvider` 抽象：`chat()` 与 `get_default_model()`。

## 基类接口

```python
from nanobot.providers.base import LLMProvider, LLMResponse, ToolCallRequest

class LLMProvider(ABC):
    def __init__(self, api_key: str | None = None, api_base: str | None = None): ...

    @abstractmethod
    async def chat(
        self,
        messages: list[dict[str, Any]],
        tools: list[dict[str, Any]] | None = None,
        model: str | None = None,
        max_tokens: int = 4096,
        temperature: float = 0.7,
    ) -> LLMResponse: ...

    @abstractmethod
    def get_default_model(self) -> str: ...
```

- **LLMResponse**：`content`、`tool_calls: list[ToolCallRequest]`、`finish_reason`、`usage`；`has_tool_calls` 属性。
- **ToolCallRequest**：`id`、`name`、`arguments`（dict）。

## 支持的 Provider（配置键）

| Provider   | 用途说明           |
|-----------|--------------------|
| openrouter | 推荐，多模型统一入口 |
| anthropic  | Claude 直连        |
| openai     | GPT 直连           |
| deepseek   | DeepSeek 直连      |
| groq       | LLM + Whisper 语音转写 |
| gemini     | Gemini 直连        |
| vllm       | 本地 / OpenAI 兼容端点 |
| moonshot   | Kimi/Moonshot      |

配置中通过 `config.get_api_key(model)` / `config.get_api_base(model)` 按模型名解析到对应 provider 的 api_key 与 api_base。

## 本地 vLLM 示例

```json
{
  "providers": {
    "vllm": {
      "apiKey": "dummy",
      "apiBase": "http://localhost:8000/v1"
    }
  },
  "agents": {
    "defaults": {
      "model": "meta-llama/Llama-3.1-8B-Instruct"
    }
  }
}
```

## 参考

- 源码: `nanobot/providers/base.py`，具体实现见 `nanobot/providers/`（如 litellm）
- README: <https://github.com/HKUDS/nanobot#-configuration>
