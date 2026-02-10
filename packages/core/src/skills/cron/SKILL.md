---
name: cron
description: Manage workspace cron jobs stored as JSON under [catalog:workspace]/cron and executed by the agentic gateway. Use when scheduling reminders, recurring agent turns, or wake events, or when the user mentions cron, schedules, or reminders.
---

# Cron

## Purpose

Schedule recurring or one-shot agent turns for the **main session**.  
Each job stores a cron expression and a prompt; when it fires, the gateway calls `session.main.reply(prompt)`.

## Storage Layout

Cron jobs live in a single JSON file:

- Path: `[catalog:workspace]/cron/jobs.json`
- Shape:

```json
{
  "jobs": [
    {
      "id": "abcd1234",
      "expr": "0 9 * * *",
      "prompt": "Good morning, summarize today\u2019s priorities based on recent context.",
      "enabled": true
    }
  ]
}
```

- **id**: short unique identifier (used with `remove`)
- **expr**: standard cron expression in minutes resolution (e.g. `"*/5 * * * *"`)
- **prompt**: text sent to the main session when the job runs
- **enabled**: optional, defaults to `true`; when `false` the job is ignored

The gateway process polls this file and keeps a matching set of `CronJob`s in NestJS `SchedulerRegistry`.  
Any job removed from `jobs` will be stopped and deleted; new jobs are registered automatically.

## CLI Integration

Use the `agentic` CLI from the workspace root (`[catalog:workspace]/..`) to modify cron jobs:

- **Add a job**

  ```bash
  agentic cron add "<cron-expr>" "<prompt>"
  ```

  Examples:

  ```bash
  # Every weekday at 9:00, send a reminder
  agentic cron add "0 9 * * 1-5" "早上好，请根据最近的对话帮我列一个今天的三件最重要的事。"

  # Every 30 minutes, check for pending tasks
  agentic cron add "*/30 * * * *" "检查当前项目进度和待办事项，给出简短的状态更新。"
  ```

- **Remove a job**

  ```bash
  agentic cron remove <cron-id>
  ```

  The `<cron-id>` is the `id` field printed when a job is added and stored in `jobs.json`.

## Chat Command Pattern

When the user types a `/cron` command inside the agent:

- Map to CLI invocations instead of editing JSON by hand.

| Pattern | Action |
|--------|--------|
| `/cron add <expr> <prompt>` | Run `agentic cron add "<expr>" "<prompt>"` |
| `/cron remove <id>` | Run `agentic cron remove <id>` |

Guidelines when generating prompts for reminders:

- Make the `prompt` read naturally **at firing time** (e.g. mention that it is a reminder, and reference the goal: meeting, focus block, daily review, etc.).
- Optionally include concise recent context so the agent can respond with up-to-date, personalized output.

## Typical Use Cases

- Time-based reminders (daily/weekly reviews, standups, check-ins)
- Periodic status checks on projects or repositories
- Regular summaries of recent `memory` entries or workspace changes

