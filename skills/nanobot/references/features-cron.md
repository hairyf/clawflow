---
source: https://github.com/HKUDS/nanobot
title: Cron 定时任务
category: features
---

# Cron：定时任务服务

CronService 管理定时任务：支持一次性（at）、间隔（every）、cron 表达式；持久化到 JSON；到点调用 `on_job(job)` 执行（通常注入 Agent 的 process_direct）。

## 调度类型（CronSchedule）

- **at**：`at_ms` 单次运行时间（毫秒时间戳）
- **every**：`every_ms` 间隔（毫秒）
- **cron**：`expr` cron 表达式，可选 `tz`

## 任务负载（CronPayload）

- `kind`：如 `agent_turn`
- `message`：发给 Agent 的文本
- `deliver`：是否在完成后向用户推送结果
- `channel` / `to`：推送目标（如 telegram + user_id）

## 使用方式

```python
async def run_job(job: CronJob) -> str | None:
    # 调用 agent.process_direct(job.payload.message, ...)
    return "Done"

service = CronService(
    store_path=Path("~/.nanobot/cron.json"),
    on_job=run_job,
)
await service.start()
# ... 运行期间 ...
await service.stop()
```

CLI 封装：

```bash
nanobot cron add --name "daily" --message "Good morning!" --cron "0 9 * * *"
nanobot cron add --name "hourly" --message "Check status" --every 3600
nanobot cron add --name "once" --message "Remind me" --at "2025-01-31T15:00:00"
nanobot cron list
nanobot cron remove <job_id>
```

## 参考

- 源码: `nanobot/cron/service.py`, `nanobot/cron/types.py`
- 使用: `workspace/AGENTS.md`（提醒用 exec 调 cron add，不要只写 MEMORY）
