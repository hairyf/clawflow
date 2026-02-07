---
source: https://github.com/HKUDS/nanobot
title: Security 安全
category: advanced
---

# 安全与沙箱

## 配置项

| 选项 | 默认 | 说明 |
|------|------|------|
| `tools.restrictToWorkspace` | false | 为 true 时，所有文件与 shell 类工具限制在 workspace 内，防止路径穿越与越权访问 |
| `channels.*.allowFrom` | [] | 白名单用户 ID；空为允许所有人，非空仅允许列表中的用户与 bot 交互 |

## 生产建议

- 部署对外服务时建议设置 `restrictToWorkspace: true`。
- 为 Telegram/Discord/Feishu 等配置 `allowFrom`，只允许可信 user ID。

## Exec 工具安全（与 nanobot 行为一致）

- 命令超时（默认 60s 可配置）
- 危险命令黑名单（如 rm -rf、format、dd、shutdown 等）
- 输出截断（如 10_000 字符）
- 与 `restrictToWorkspace` 配合可限制工作目录

## 参考

- 配置: `nanobot/config/schema.py`（ToolsConfig、ChannelsConfig）
- README: <https://github.com/HKUDS/nanobot#security>
- SECURITY: `sources/nanobot/SECURITY.md`
