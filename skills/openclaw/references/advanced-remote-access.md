---
title: Remote Access
category: advanced
source: https://github.com/openclaw/openclaw/blob/main/docs/gateway/remote.md
---

# Remote Access

SSH tunnels, tailnets, Tailscale Serve/Funnel, and safe exposure.

## The core idea

- The Gateway WebSocket binds to **loopback** on your configured port (defaults to 18789)
- For remote use, you forward that loopback port over SSH (or use a tailnet/VPN and tunnel less)

## Common VPN/tailnet setups (where the agent lives)

Think of the **Gateway host** as "where the agent lives." It owns sessions, auth profiles, channels, and state. Your laptop/desktop (and nodes) connect to that host.

### 1) Always-on Gateway in your tailnet (VPS or home server)

Run the Gateway on a persistent host and reach it via **Tailscale** or SSH.

- **Best UX**: keep `gateway.bind="loopback"` and use **Tailscale Serve** for the Control UI
- **Fallback**: keep loopback + SSH tunnel from any machine that needs access

This is ideal when your laptop sleeps often but you want the agent always-on.

### 2) Home desktop runs the Gateway, laptop is remote control

The laptop does **not** run the agent. It connects remotely:

- Use the macOS app's **Remote over SSH** mode (Settings → General → "OpenClaw runs")
- The app opens and manages the tunnel, so WebChat + health checks "just work"

### 3) Laptop runs the Gateway, remote access from other machines

Keep the Gateway local but expose it safely:

- SSH tunnel to the laptop from other machines, or
- Tailscale Serve the Control UI and keep the Gateway loopback-only

## SSH tunnel (CLI + tools)

Create a local tunnel to the remote Gateway WS:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

With the tunnel up:

- `openclaw health` and `openclaw status --deep` now reach the remote gateway via `ws://127.0.0.1:18789`
- `openclaw gateway {status,health,send,agent,call}` can also target the forwarded URL via `--url` when needed

Note: replace `18789` with your configured `gateway.port` (or `--port`/`OPENCLAW_GATEWAY_PORT`).

## CLI remote defaults

You can persist a remote target so CLI commands use it by default:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

When the gateway is loopback-only, keep the URL at `ws://127.0.0.1:18789` and open the SSH tunnel first.

## Tailscale Serve (tailnet-only)

OpenClaw can auto-configure Tailscale **Serve** (tailnet-only) for the Gateway dashboard and WebSocket port. This keeps the Gateway bound to loopback while Tailscale provides HTTPS, routing, and identity headers.

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "serve" },
  },
}
```

Open: `https://<magicdns>/` (or your configured `gateway.controlUi.basePath`)

Auth:

- When `gateway.auth.allowTailscale=true`, valid Serve proxy requests can authenticate via Tailscale identity headers (`tailscale-user-login`) without supplying a token/password
- To require explicit credentials, set `gateway.auth.allowTailscale=false` or force `gateway.auth.mode="password"`

## Tailscale Funnel (public internet)

```json5
{
  gateway: {
    bind: "loopback",
    tailscale: { mode: "funnel" },
    auth: { mode: "password", password: "replace-me" },
  },
}
```

Prefer `OPENCLAW_GATEWAY_PASSWORD` over committing a password to disk.

Notes:

- Tailscale Funnel requires the `tailscale` CLI to be installed and logged in
- `tailscale.mode="funnel"` refuses to start unless auth mode is `password` to avoid public exposure
- Set `gateway.tailscale.resetOnExit` if you want OpenClaw to undo `tailscale serve` or `tailscale funnel` configuration on shutdown

## Tailnet bind (direct Tailnet IP)

Use this when you want the Gateway to listen directly on the Tailnet IP (no Serve/Funnel).

```json5
{
  gateway: {
    bind: "tailnet",
    auth: { mode: "token", token: "your-token" },
  },
}
```

Connect from another Tailnet device:

- Control UI: `http://<tailscale-ip>:18789/`
- WebSocket: `ws://<tailscale-ip>:18789`

Note: loopback (`http://127.0.0.1:18789`) will **not** work in this mode.

## Security rules (remote/VPN)

Short version: **keep the Gateway loopback-only** unless you're sure you need a bind.

- **Loopback + SSH/Tailscale Serve** is the safest default (no public exposure)
- **Non-loopback binds** (`lan`/`tailnet`/`custom`, or `auto` when loopback is unavailable) must use auth tokens/passwords
- `gateway.remote.token` is **only** for remote CLI calls — it does **not** enable local auth
- `gateway.remote.tlsFingerprint` pins the remote TLS cert when using `wss://`
- **Tailscale Serve** can authenticate via identity headers when `gateway.auth.allowTailscale=true`. Set it to `false` if you want tokens/passwords instead
- Treat browser control like operator access: tailnet-only + deliberate node pairing

## Browser control (remote Gateway + local browser)

If you run the Gateway on one machine but want to drive a browser on another machine, run a **node host** on the browser machine and keep both on the same tailnet. The Gateway will proxy browser actions to the node; no separate control server or Serve URL needed.

Avoid Funnel for browser control; treat node pairing like operator access.

## macOS app "Remote over SSH"

The macOS menu bar app can drive the same setup end-to-end (remote status checks, WebChat, and Voice Wake forwarding).

- Use the app's **Remote over SSH** mode (Settings → General → "OpenClaw runs")
- The app opens and manages the tunnel, so WebChat + health checks "just work"
