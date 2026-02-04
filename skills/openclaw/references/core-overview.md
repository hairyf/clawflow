---
title: OpenClaw Overview
category: core
source: https://github.com/openclaw/openclaw/blob/main/README.md
---

# OpenClaw Overview

**OpenClaw** is a personal AI assistant you run on your own devices. It connects to the channels you already use (WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, WebChat, plus extensions like BlueBubbles, Matrix, Zalo) and provides a unified Gateway control plane for sessions, tools, and events.

## Core capabilities

- **Local-first Gateway**: Single WebSocket control plane (`ws://127.0.0.1:18789`) for sessions, channels, tools, events, and presence
- **Multi-channel inbox**: WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, BlueBubbles, Microsoft Teams, Matrix, Zalo, WebChat, macOS, iOS/Android
- **First-class tools**: Browser control (dedicated Chrome/Chromium), Canvas (A2UI), nodes (camera/screen/location/notifications), cron, sessions, Discord/Slack actions
- **Voice Wake + Talk Mode**: Always-on speech for macOS/iOS/Android with ElevenLabs
- **Companion apps**: macOS menu bar app, iOS/Android nodes (optional; Gateway alone delivers full experience)
- **Sandboxing**: Optional Docker isolation for tools (per-session or per-agent)
- **Multi-agent routing**: Route inbound channels/accounts/peers to isolated agents with separate workspaces + sessions

## Quick start

Runtime: **Node ≥22** (Bun not recommended for WhatsApp/Telegram)

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
openclaw gateway --port 18789 --verbose
```

Fastest chat: open the Control UI (no channel setup needed):

```bash
openclaw dashboard
# or: http://127.0.0.1:18789/
```

## How it works (short)

```
WhatsApp / Telegram / Slack / Discord / Google Chat / Signal / iMessage / ...
               │
               ▼
┌───────────────────────────────┐
│            Gateway            │
│       (control plane)         │
│     ws://127.0.0.1:18789      │
└──────────────┬────────────────┘
               │
               ├─ Pi agent (RPC)
               ├─ CLI (openclaw …)
               ├─ WebChat UI
               ├─ macOS app
               └─ iOS / Android nodes
```

## Key subsystems

- **Gateway WebSocket network**: Single WS control plane for clients, tools, and events
- **Tailscale exposure**: Serve (tailnet-only) or Funnel (public) for the Gateway dashboard + WS
- **Browser control**: openclaw-managed Chrome/Chromium with CDP control
- **Canvas + A2UI**: Agent-driven visual workspace (A2UI v0.8 host)
- **Voice Wake + Talk Mode**: Always-on speech and continuous conversation
- **Nodes**: Canvas, camera snap/clip, screen record, `location.get`, notifications, plus macOS-only `system.run`/`system.notify`

## Security defaults (DM access)

Default behavior on Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **DM pairing** (`dmPolicy="pairing"`): unknown senders receive a short pairing code and the bot does not process their message
- Approve with: `openclaw pairing approve <channel> <code>` (then the sender is added to a local allowlist store)
- Public inbound DMs require an explicit opt-in: set `dmPolicy="open"` and include `"*"` in the channel allowlist

Run `openclaw doctor` to surface risky/misconfigured DM policies.

## Models (selection + auth)

- **Recommended**: Anthropic Pro/Max (100/200) + Opus 4.5 for long-context strength and better prompt-injection resistance
- **OAuth**: Anthropic (Claude Pro/Max), OpenAI (ChatGPT/Codex)
- **API keys**: Any provider (Anthropic, OpenAI, custom APIs)
- **Auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (OAuth + API keys)
- **Model failover**: Auth profile rotation within provider, then model fallback to `agents.defaults.model.fallbacks`

## Development channels

- **stable**: tagged releases (`vYYYY.M.D`), npm dist-tag `latest`
- **beta**: prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`
- **dev**: moving head of `main`, npm dist-tag `dev`

Switch channels: `openclaw update --channel stable|beta|dev`

## Agent workspace + skills

- Workspace root: `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`)
- Injected prompt files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`
- Skills: `~/.openclaw/workspace/skills/<skill>/SKILL.md`
- Skills registry: ClawHub (minimal skill registry; agent can search and pull new skills automatically)

## Remote Gateway (Linux is great)

It's perfectly fine to run the Gateway on a small Linux instance. Clients (macOS app, CLI, WebChat) can connect over **Tailscale Serve/Funnel** or **SSH tunnels**, and you can still pair device nodes (macOS/iOS/Android) to execute device-local actions when needed.

- **Gateway host** runs the exec tool and channel connections by default
- **Device nodes** run device-local actions (`system.run`, camera, screen recording, notifications) via `node.invoke`

In short: exec runs where the Gateway lives; device actions run where the device lives.
