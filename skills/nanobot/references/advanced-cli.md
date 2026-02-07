---
source: https://github.com/HKUDS/nanobot
title: CLI 命令
category: advanced
---

# CLI 命令速查

| 命令 | 说明 |
|------|------|
| `nanobot onboard` | 初始化配置与 workspace |
| `nanobot agent -m "..."` | 单条消息对话 |
| `nanobot agent` | 交互式对话 |
| `nanobot gateway` | 启动网关（渠道 + bus dispatch） |
| `nanobot status` | 状态查看 |
| `nanobot channels login` | WhatsApp 扫码绑定设备 |
| `nanobot channels status` | 渠道状态 |

## Cron 子命令

```bash
nanobot cron add --name "daily" --message "Good morning!" --cron "0 9 * * *"
nanobot cron add --name "hourly" --message "Check" --every 3600
nanobot cron add --name "once" --message "Remind" --at "2025-01-31T15:00:00"
nanobot cron list
nanobot cron remove <job_id>
```

## 配置路径

- 配置：`~/.nanobot/config.json`
- Workspace：配置中 `agents.defaults.workspace`，默认 `~/.nanobot/workspace`

## 参考

- 源码: `nanobot/cli/commands.py`
- README: <https://github.com/HKUDS/nanobot#cli-reference>
