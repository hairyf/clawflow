---
title: OpenClaw Architecture
category: core
source: https://github.com/openclaw/openclaw/blob/main/docs/concepts/architecture.md
---

# OpenClaw Architecture

OpenClaw uses a **Gateway** control plane that coordinates sessions, channels, tools, and events. The Gateway is just the control plane — the product is the assistant.

## Gateway WebSocket network

Single WS control plane for clients, tools, and events:

- **Default bind**: `ws://127.0.0.1:18789`
- **Clients**: macOS app, CLI, WebChat, iOS/Android nodes
- **Channels**: WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, Microsoft Teams, etc.
- **Tools**: browser, canvas, nodes, cron, sessions, Discord/Slack actions

## Sessions

- **`main`**: canonical direct-chat key for your personal session
- **Group/channel sessions**: isolated by channel + peer/group ID
- **Session isolation**: each session has its own transcript, model override, thinking level, verbose level, send policy, and group activation
- **Session stickiness**: auth profiles are pinned per session to keep provider caches warm

## Agents

- **Agent ID**: logical routing target (default: `main`)
- **Workspace**: `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`)
- **Multi-agent routing**: route inbound channels/accounts/peers to isolated agents with separate workspaces + sessions
- **Per-agent overrides**: `agents.list[].model`, `agents.list[].sandbox`, `agents.list[].tools`

## Nodes

Nodes are **peripherals** that expose device-local actions:

- **macOS node mode**: `system.run`, `system.notify`, canvas, camera, screen recording
- **iOS/Android nodes**: Canvas, camera, screen recording, location
- **Node pairing**: Bonjour/mDNS discovery + pairing code approval
- **Node invocation**: Gateway calls nodes via `node.invoke` (WS RPC)

Nodes do **not** run the gateway service. Only one gateway should run per host unless you intentionally run isolated profiles.

## Where execution happens

- **Gateway host** runs the exec tool and channel connections by default
- **Device nodes** run device-local actions (`system.run`, camera, screen recording, notifications) via `node.invoke`
- **Sandboxed sessions** run tools inside Docker containers (optional; controlled by `agents.defaults.sandbox.mode`)

In short: exec runs where the Gateway lives; device actions run where the device lives.

## Command flow (what runs where)

Flow example (Telegram → node):

1. Telegram message arrives at the **Gateway**
2. Gateway runs the **agent** and decides whether to call a node tool
3. Gateway calls the **node** over the Gateway WebSocket (`node.*` RPC)
4. Node returns the result; Gateway replies back out to Telegram

## Pi agent runtime

- **RPC mode**: tool streaming and block streaming
- **Session model**: `main` for direct chats, group isolation, activation modes, queue modes, reply-back
- **Media pipeline**: images/audio/video, transcription hooks, size caps, temp file lifecycle

## Control UI + WebChat

- **Control UI**: Gateway dashboard served directly from the Gateway (no separate HTTP port)
- **WebChat**: SwiftUI chat UI connects directly to the Gateway WebSocket
- **Dashboard**: `http://127.0.0.1:18789/` (or your configured `gateway.controlUi.basePath`)

## Gateway auth

- **Token**: `gateway.auth.token` (default when `OPENCLAW_GATEWAY_TOKEN` is set)
- **Password**: `gateway.auth.password` (shared secret via `OPENCLAW_GATEWAY_PASSWORD` or config)
- **Tailscale identity headers**: when `gateway.tailscale.mode="serve"` and `gateway.auth.allowTailscale=true`

## Tailscale exposure

- **Serve** (tailnet-only): `tailscale serve` for the Gateway dashboard + WS
- **Funnel** (public): `tailscale funnel` for public HTTPS (requires shared password auth)
- **Tailnet bind**: `gateway.bind="tailnet"` for direct Tailnet IP binding (no Serve/Funnel)

## Remote access patterns

### 1) Always-on Gateway in your tailnet (VPS or home server)

Run the Gateway on a persistent host and reach it via **Tailscale** or SSH.

- **Best UX**: keep `gateway.bind="loopback"` and use **Tailscale Serve** for the Control UI
- **Fallback**: keep loopback + SSH tunnel from any machine that needs access

### 2) Home desktop runs the Gateway, laptop is remote control

The laptop does **not** run the agent. It connects remotely:

- Use the macOS app's **Remote over SSH** mode (Settings → General → "OpenClaw runs")
- The app opens and manages the tunnel, so WebChat + health checks "just work"

### 3) Laptop runs the Gateway, remote access from other machines

Keep the Gateway local but expose it safely:

- SSH tunnel to the laptop from other machines, or
- Tailscale Serve the Control UI and keep the Gateway loopback-only

## Security rules (remote/VPN)

Short version: **keep the Gateway loopback-only** unless you're sure you need a bind.

- **Loopback + SSH/Tailscale Serve** is the safest default (no public exposure)
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, or `auto` when loopback is unavailable) must use auth tokens/passwords
- **Tailscale Serve** can authenticate via identity headers when `gateway.auth.allowTailscale=true`
- Treat browser control like operator access: tailnet-only + deliberate node pairing
