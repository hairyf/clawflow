---
source: https://github.com/HKUDS/nanobot
title: Configuration
category: core
---

# 配置：Schema 与加载

配置主文件：`~/.nanobot/config.json`。使用 Pydantic 建模，键在 JSON 中为 camelCase，加载时转为 snake_case。

## 主要配置块

- **agents**：`defaults.workspace`、`defaults.model`、`max_tokens`、`temperature`、`max_tool_iterations`
- **channels**：`telegram`、`discord`、`whatsapp`、`feishu`（各含 `enabled`、token/凭证、`allow_from` 等）
- **providers**：`openrouter`、`anthropic`、`openai`、`deepseek`、`groq`、`zhipu`、`vllm`、`gemini`、`moonshot`（各含 `api_key`、`api_base`）
- **gateway**：`host`、`port`（默认 18790）
- **tools**：`web.search.apiKey`、`exec.timeout`、`restrictToWorkspace`

## 加载与保存

```python
from nanobot.config.loader import load_config, save_config, get_config_path
from pathlib import Path

config = load_config()                    # 默认 get_config_path()
config = load_config(Path("/path/to/config.json"))
save_config(config)
```

## 按模型选 Provider

- `config.get_api_key(model)`：按模型名匹配 provider（如 openrouter、deepseek、anthropic），返回对应 api_key。
- `config.get_api_base(model)`：部分模型需要自定义 api_base（如 openrouter、zhipu、vllm）。

## 安全相关

- `tools.restrictToWorkspace`：为 true 时，文件与 shell 类工具限制在 workspace 内。
- `channels.*.allowFrom`：白名单用户 ID，空列表表示允许所有人。

## 参考

- 源码: `nanobot/config/schema.py`, `nanobot/config/loader.py`
- README: <https://github.com/HKUDS/nanobot#-configuration>
