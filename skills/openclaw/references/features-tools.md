---
title: Tools
category: features
source: https://github.com/openclaw/openclaw/blob/main/docs/tools/index.md
---

# Tools

Tool surface (profiles, allow/deny), and what each tool does.

## Tool profiles (base allowlist)

`tools.profile` sets a **base tool allowlist** before `tools.allow`/`tools.deny`.

Profiles:

- `minimal`: `session_status` only
- `coding`: `group:fs`, `group:runtime`, `group:sessions`, `group:memory`, `image`
- `messaging`: `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`
- `full`: no restriction (same as unset)

## Tool groups (shorthands)

- `group:runtime`: `exec`, `bash`, `process`
- `group:fs`: `read`, `write`, `edit`, `apply_patch`
- `group:sessions`: `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `session_status`
- `group:memory`: `memory_search`, `memory_get`
- `group:web`: `web_search`, `web_fetch`
- `group:ui`: `browser`, `canvas`
- `group:automation`: `cron`, `gateway`
- `group:messaging`: `message`
- `group:nodes`: `nodes`
- `group:openclaw`: all built-in OpenClaw tools (excludes provider plugins)

## Tool policy (global + per-agent)

```json5
{
  tools: {
    profile: "coding",
    allow: ["group:fs", "group:runtime", "browser"],
    deny: ["exec", "process"],
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

Per-agent override:

```json5
{
  agents: {
    list: [
      {
        id: "support",
        tools: {
          profile: "messaging",
          allow: ["slack", "discord"],
        },
      },
    ],
  },
}
```

## Tool inventory

### `exec`

Run shell commands in the workspace.

Core parameters:

- `command` (required)
- `yieldMs` (auto-background after timeout, default 10000)
- `background` (immediate background)
- `timeout` (seconds; kills the process if exceeded, default 1800)
- `elevated` (bool; run on host if elevated mode is enabled/allowed; only changes behavior when the agent is sandboxed)
- `host` (`sandbox | gateway | node`)
- `security` (`deny | allowlist | full`)
- `ask` (`off | on-miss | always`)
- `node` (node id/name for `host=node`)
- `pty` (bool; allocate a real TTY)

### `process`

Manage background exec sessions.

Actions: `list`, `poll`, `log`, `write`, `kill`, `clear`, `remove`

### `web_search`

Search the web using Brave Search API.

Parameters: `query` (required), `count` (1–10)

Requires: Brave API key (`openclaw configure --section web` or `BRAVE_API_KEY`)

### `web_fetch`

Fetch and extract readable content from a URL (HTML → markdown/text).

Parameters: `url` (required), `extractMode` (`markdown` | `text`), `maxChars`

### `browser`

Control the dedicated OpenClaw-managed browser.

Actions:

- `status`, `start`, `stop`, `tabs`, `open`, `focus`, `close`
- `snapshot` (aria/ai)
- `screenshot` (returns image block + `MEDIA:<path>`)
- `act` (UI actions: click/type/press/hover/drag/select/fill/resize/wait/evaluate)
- `navigate`, `console`, `pdf`, `upload`, `dialog`
- `profiles`, `create-profile`, `delete-profile`, `reset-profile`

Parameters: `profile` (optional; defaults to `browser.defaultProfile`), `target` (`sandbox` | `host` | `node`), `node` (optional)

### `canvas`

Drive the node Canvas (present, eval, snapshot, A2UI).

Actions: `present`, `hide`, `navigate`, `eval`, `snapshot`, `a2ui_push`, `a2ui_reset`

### `nodes`

Discover and target paired nodes; send notifications; capture camera/screen.

Actions:

- `status`, `describe`
- `pending`, `approve`, `reject` (pairing)
- `notify` (macOS `system.notify`)
- `run` (macOS `system.run`)
- `camera_snap`, `camera_clip`, `screen_record`
- `location_get`

### `image`

Analyze an image with the configured image model.

Parameters: `image` (required path or URL), `prompt` (optional), `model` (optional override), `maxBytesMb` (optional)

### `message`

Send messages and channel actions across Discord/Google Chat/Slack/Telegram/WhatsApp/Signal/iMessage/MS Teams.

Actions:

- `send` (text + optional media; MS Teams also supports `card` for Adaptive Cards)
- `poll` (WhatsApp/Discord/MS Teams polls)
- `react` / `reactions` / `read` / `edit` / `delete`
- `pin` / `unpin` / `list-pins`
- `permissions`
- `thread-create` / `thread-list` / `thread-reply`
- `search`, `sticker`, `member-info`, `role-info`
- `emoji-list` / `emoji-upload` / `sticker-upload`
- `role-add` / `role-remove`
- `channel-info` / `channel-list`
- `voice-status`
- `event-list` / `event-create`
- `timeout` / `kick` / `ban`

### `cron`

Manage Gateway cron jobs and wakeups.

Actions: `status`, `list`, `add`, `update`, `remove`, `run`, `runs`, `wake`

### `gateway`

Restart or apply updates to the running Gateway process (in-place).

Actions:

- `restart` (authorizes + sends `SIGUSR1` for in-process restart)
- `config.get` / `config.schema`
- `config.apply` (validate + write config + restart + wake)
- `config.patch` (merge partial update + restart + wake)
- `update.run` (run update + restart + wake)

### `sessions_list` / `sessions_history` / `sessions_send` / `sessions_spawn` / `session_status`

List sessions, inspect transcript history, or send to another session.

Parameters:

- `sessions_list`: `kinds?`, `limit?`, `activeMinutes?`, `messageLimit?`
- `sessions_history`: `sessionKey` (or `sessionId`), `limit?`, `includeTools?`
- `sessions_send`: `sessionKey` (or `sessionId`), `message`, `timeoutSeconds?`
- `sessions_spawn`: `task`, `label?`, `agentId?`, `model?`, `runTimeoutSeconds?`, `cleanup?`
- `session_status`: `sessionKey?` (default current), `model?` (`default` clears override)

### `agents_list`

List agent ids that the current session may target with `sessions_spawn`.

## Disabling tools

```json5
{
  tools: { deny: ["browser"] },
}
```

Notes:

- Matching is case-insensitive
- `*` wildcards are supported (`"*"` means all tools)
- If `tools.allow` only references unknown or unloaded plugin tool names, OpenClaw logs a warning and ignores the allowlist so core tools stay available

## Provider-specific tool policy

Use `tools.byProvider` to **further restrict** tools for specific providers (or a single `provider/model`) without changing your global defaults.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

## Safety

- Avoid direct `system.run`; use `nodes` → `run` only with explicit user consent
- Respect user consent for camera/screen capture
- Use `status/describe` to ensure permissions before invoking media commands
