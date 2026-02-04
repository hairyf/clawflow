---
title: OpenClaw Configuration
category: core
source: https://github.com/openclaw/openclaw/blob/main/docs/gateway/configuration.md
---

# OpenClaw Configuration

Where config/state lives, key files, and high-signal settings.

## Config file locations

- **Main config**: `~/.openclaw/openclaw.json` (or `OPENCLAW_CONFIG` env var)
- **Auth profiles**: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (OAuth + API keys)
- **Legacy OAuth import**: `~/.openclaw/credentials/oauth.json` (imported into `auth-profiles.json` on first use)
- **Workspace**: `~/.openclaw/workspace` (configurable via `agents.defaults.workspace`)
- **Models registry**: `~/.openclaw/agents/<agentId>/models.json` (custom providers)

## Minimal config (model + defaults)

```json5
{
  agent: {
    model: "anthropic/claude-opus-4-5",
  },
}
```

## High-signal settings

### Gateway

```json5
{
  gateway: {
    bind: "loopback",  // "loopback" | "lan" | "tailnet" | "custom" | "auto"
    port: 18789,
    auth: {
      mode: "token",  // "token" | "password" | "off"
      token: "your-token",  // or OPENCLAW_GATEWAY_TOKEN
      allowTailscale: true,  // allow Tailscale identity headers (Serve only)
    },
    tailscale: {
      mode: "off",  // "off" | "serve" | "funnel"
      resetOnExit: false,
    },
  },
}
```

### Models + auth

```json5
{
  agent: {
    model: {
      primary: "anthropic/claude-opus-4-5",
      fallbacks: ["anthropic/claude-sonnet-4-5", "openai/gpt-5.2"],
    },
    imageModel: {
      primary: "anthropic/claude-sonnet-4-5",
      fallbacks: [],
    },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-5": { alias: "Opus" },
      "openai/gpt-5.2": { alias: "GPT-5.2" },
    },
  },
  auth: {
    profiles: [
      { id: "anthropic:default", type: "api_key", provider: "anthropic" },
      { id: "openai:default", type: "api_key", provider: "openai" },
    ],
    order: {
      anthropic: ["anthropic:default"],
      openai: ["openai:default"],
    },
  },
}
```

### Channels

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["*"],  // or specific phone numbers
      groups: { "*": {} },  // or specific group IDs
    },
    telegram: {
      botToken: "123456:ABCDEF",  // or TELEGRAM_BOT_TOKEN
      allowFrom: ["*"],
      groups: { "*": { requireMention: true } },
    },
    discord: {
      token: "1234abcd",  // or DISCORD_BOT_TOKEN
      dm: {
        policy: "pairing",  // "pairing" | "open" | "closed"
        allowFrom: [],  // or ["*"] for open
      },
      guilds: { "*": {} },
    },
    slack: {
      botToken: "xoxb-...",  // or SLACK_BOT_TOKEN
      appToken: "xapp-...",  // or SLACK_APP_TOKEN
      dm: {
        policy: "pairing",
        allowFrom: [],
      },
    },
  },
}
```

### Sandboxing

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",  // "off" | "non-main" | "all"
        scope: "session",  // "session" | "agent" | "shared"
        workspaceAccess: "none",  // "none" | "ro" | "rw"
        docker: {
          network: "none",  // "none" | "bridge" | "host"
          binds: [],  // ["host:container:mode"]
          setupCommand: null,  // one-time container setup
        },
        browser: {
          autoStart: true,
          autoStartTimeoutMs: 30000,
          allowHostControl: false,
        },
      },
    },
  },
}
```

### Tools

```json5
{
  tools: {
    profile: "full",  // "minimal" | "coding" | "messaging" | "full"
    allow: [],  // or ["group:fs", "group:runtime", "browser"]
    deny: [],  // or ["exec", "process"]
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.2": { allow: ["group:fs", "sessions_list"] },
    },
    sandbox: {
      tools: {
        allow: ["bash", "process", "read", "write", "edit", "sessions_list", "sessions_history", "sessions_send", "sessions_spawn"],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
    elevated: {
      enabled: false,
      allowFrom: {
        whatsapp: [],
        telegram: [],
      },
    },
    web: {
      search: {
        enabled: true,
        apiKey: "your-brave-api-key",  // or BRAVE_API_KEY
        maxResults: 5,
      },
      fetch: {
        enabled: true,
      },
    },
  },
}
```

### Multi-agent routing

```json5
{
  routing: {
    agents: {
      main: {
        workspace: "~/.openclaw/workspace",
        sandbox: { mode: "off" },
      },
      work: {
        workspace: "~/.openclaw/workspace-work",
        model: { primary: "openai/gpt-5.2" },
        sandbox: { mode: "all" },
        tools: {
          profile: "coding",
          deny: ["browser", "canvas"],
        },
      },
    },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-opus-4-5" },
      sandbox: { mode: "non-main" },
    },
    list: [
      { id: "main" },
      { id: "work" },
    ],
  },
}
```

## Environment variables (precedence)

Env vars win over config file:

- `OPENCLAW_CONFIG`: path to config file
- `OPENCLAW_GATEWAY_TOKEN`: gateway auth token
- `OPENCLAW_GATEWAY_PASSWORD`: gateway auth password
- `OPENCLAW_GATEWAY_PORT`: gateway port
- `TELEGRAM_BOT_TOKEN`: Telegram bot token
- `DISCORD_BOT_TOKEN`: Discord bot token
- `SLACK_BOT_TOKEN`: Slack bot token
- `SLACK_APP_TOKEN`: Slack app token
- `BRAVE_API_KEY`: Brave Search API key
- `OPENROUTER_API_KEY`: OpenRouter API key

## Config validation

```bash
openclaw doctor
openclaw security audit --deep
openclaw sandbox explain
```

## Full reference

See [Gateway configuration](https://docs.openclaw.ai/gateway/configuration) for every key and example.
