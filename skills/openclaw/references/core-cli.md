---
title: OpenClaw CLI
category: core
source: https://github.com/openclaw/openclaw/blob/main/docs/cli
---

# OpenClaw CLI

Essential CLI commands for onboarding, running, health checks, and messaging.

## Install

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
# or: npm install -g openclaw@latest
# or: pnpm add -g openclaw@latest
```

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

## Onboarding wizard (recommended)

```bash
openclaw onboard --install-daemon
```

What you'll choose:

- **Local vs Remote** gateway
- **Auth**: OpenAI Code (Codex) subscription (OAuth) or API keys. For Anthropic we recommend an API key; `claude setup-token` is also supported
- **Providers**: WhatsApp QR login, Telegram/Discord bot tokens, etc.
- **Daemon**: background install (launchd/systemd; WSL2 uses systemd)
- **Gateway token**: the wizard generates one by default (even on loopback) and stores it in `gateway.auth.token`

## Gateway

```bash
openclaw gateway --port 18789 --verbose
openclaw gateway status
openclaw gateway stop
openclaw gateway restart
```

Dashboard (local loopback): `http://127.0.0.1:18789/`

⚠️ **Bun warning (WhatsApp + Telegram):** Bun has known issues with these channels. If you use WhatsApp or Telegram, run the Gateway with **Node**.

## Health checks

```bash
openclaw status
openclaw health
openclaw security audit --deep
openclaw doctor
```

Tip: `openclaw status --all` is the best pasteable, read-only debug report.

## Channels

```bash
openclaw channels login  # WhatsApp QR login
openclaw channels list
openclaw channels status
```

## Pairing (DM safety)

Default posture: unknown DMs get a short code and messages are not processed until approved.

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <code>
openclaw pairing list telegram
openclaw pairing approve telegram <code>
```

## Messaging

```bash
openclaw message send --to +1234567890 --message "Hello from OpenClaw"
openclaw agent --message "Ship checklist" --thinking high
```

## Models

```bash
openclaw models list
openclaw models status
openclaw models set <provider/model>
openclaw models set-image <provider/model>

openclaw models aliases list
openclaw models aliases add <alias> <provider/model>
openclaw models aliases remove <alias>

openclaw models fallbacks list
openclaw models fallbacks add <provider/model>
openclaw models fallbacks remove <provider/model>
openclaw models fallbacks clear
```

`openclaw models` (no subcommand) is a shortcut for `models status`.

## Sandbox

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

Prints:

- effective sandbox mode/scope/workspace access
- whether the session is currently sandboxed (main vs non-main)
- effective sandbox tool allow/deny (and whether it came from agent/global/default)
- elevated gates and fix-it key paths

## Configuration

```bash
openclaw configure --section web  # Brave Search API key
openclaw configure --section models
openclaw configure --section gateway
```

## Nodes (macOS/iOS/Android)

```bash
openclaw nodes list
openclaw nodes describe <id>
openclaw nodes pending
openclaw nodes approve <code>
openclaw nodes reject <code>

openclaw nodes camera snap --node <id>
openclaw nodes camera clip --node <id> --duration 5
openclaw nodes screen record --node <id> --duration 10
openclaw nodes location get --node <id>
openclaw nodes notify --node <id> --title "Hello" --body "World"
```

## Canvas (A2UI)

```bash
openclaw nodes canvas present --node <id> --url https://example.com
openclaw nodes canvas a2ui push --node <id> --text "Hello from A2UI"
openclaw nodes canvas snapshot --node <id>
openclaw nodes canvas hide --node <id>
```

## Browser

```bash
openclaw browser status
openclaw browser start
openclaw browser stop
openclaw browser snapshot
openclaw browser screenshot
openclaw browser tabs
```

## Cron

```bash
openclaw cron list
openclaw cron add <job-json>
openclaw cron remove <id>
openclaw cron run <id>
```

## Sessions

```bash
openclaw sessions list
openclaw sessions history <sessionKey>
openclaw sessions send <sessionKey> --message "Hello"
```

## Chat commands (in WhatsApp/Telegram/Slack/Google Chat/Microsoft Teams/WebChat)

Send these in chat (group commands are owner-only):

- `/status` — compact session status (model + tokens, cost when available)
- `/new` or `/reset` — reset the session
- `/compact` — compact session context (summary)
- `/think <level>` — off|minimal|low|medium|high|xhigh (GPT-5.2 + Codex models only)
- `/verbose on|off`
- `/usage off|tokens|full` — per-response usage footer
- `/restart` — restart the gateway (owner-only in groups)
- `/activation mention|always` — group activation toggle (groups only)
- `/model` — list available models
- `/model <#>` — select from numbered picker
- `/model <provider/model>` — set model by ref
- `/model status` — detailed auth candidates + provider endpoint info
