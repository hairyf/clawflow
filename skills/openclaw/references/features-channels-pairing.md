---
title: Channels & Pairing
category: features
source: https://github.com/openclaw/openclaw/blob/main/docs/channels
---

# Channels & Pairing

DM pairing posture, allowlists, and "why my bot doesn't reply".

## Default DM posture (pairing)

OpenClaw connects to real messaging surfaces. Treat inbound DMs as **untrusted input**.

Default behavior on Telegram/WhatsApp/Signal/iMessage/Microsoft Teams/Discord/Google Chat/Slack:

- **DM pairing** (`dmPolicy="pairing"` / `channels.discord.dm.policy="pairing"` / `channels.slack.dm.policy="pairing"`): unknown senders receive a short pairing code and the bot does not process their message
- Approve with: `openclaw pairing approve <channel> <code>` (then the sender is added to a local allowlist store)
- Public inbound DMs require an explicit opt-in: set `dmPolicy="open"` and include `"*"` in the channel allowlist (`allowFrom` / `channels.discord.dm.allowFrom` / `channels.slack.dm.allowFrom`)

Run `openclaw doctor` to surface risky/misconfigured DM policies.

## Pairing workflow

1. Unknown sender DMs the bot
2. Bot replies with a short pairing code (e.g., `ABC123`)
3. Operator approves: `openclaw pairing approve whatsapp ABC123`
4. Sender is added to the local allowlist store
5. Bot processes future messages from that sender

## Pairing commands

```bash
openclaw pairing list whatsapp
openclaw pairing approve whatsapp <code>
openclaw pairing reject whatsapp <code>
openclaw pairing list telegram
openclaw pairing approve telegram <code>
```

## Channel allowlists

### WhatsApp

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["*"],  // or specific phone numbers: ["+1234567890"]
      groups: { "*": {} },  // or specific group IDs
    },
  },
}
```

### Telegram

```json5
{
  channels: {
    telegram: {
      botToken: "123456:ABCDEF",  // or TELEGRAM_BOT_TOKEN
      allowFrom: ["*"],  // or specific user IDs
      groups: {
        "*": { requireMention: true },  // or specific group IDs
      },
    },
  },
}
```

### Discord

```json5
{
  channels: {
    discord: {
      token: "1234abcd",  // or DISCORD_BOT_TOKEN
      dm: {
        policy: "pairing",  // "pairing" | "open" | "closed"
        allowFrom: [],  // or ["*"] for open
      },
      guilds: { "*": {} },  // or specific guild IDs
    },
  },
}
```

### Slack

```json5
{
  channels: {
    slack: {
      botToken: "xoxb-...",  // or SLACK_BOT_TOKEN
      appToken: "xapp-...",  // or SLACK_APP_TOKEN
      dm: {
        policy: "pairing",  // "pairing" | "open" | "closed"
        allowFrom: [],  // or ["*"] for open
      },
    },
  },
}
```

## Group routing

- **Mention gating**: `requireMention: true` (Telegram/Discord/Slack)
- **Reply tags**: bot only responds to replies to its own messages
- **Per-channel chunking**: long replies are split by channel limits
- **Activation modes**: `mention` (default) or `always` (owner-only toggle via `/activation`)

## "Why my bot doesn't reply" checklist

1. **DM pairing**: Is the sender approved? Run `openclaw pairing list <channel>`
2. **Channel allowlist**: Is the sender in `allowFrom`? Check `openclaw.json`
3. **Group allowlist**: Is the group in `groups`? Check `openclaw.json`
4. **Auth configured**: Does `openclaw health` show "no auth configured"? Run the wizard or set API keys
5. **Model allowlist**: Is the model in `agents.defaults.models`? Use `/model list` to check
6. **Gateway running**: Is the Gateway running? Run `openclaw gateway status`
7. **Channel connected**: Is the channel connected? Run `openclaw channels status`

## Security notes

- **DM pairing is the default**: unknown senders get a pairing code and messages are not processed until approved
- **Open DM policy is opt-in**: set `dmPolicy="open"` and include `"*"` in the allowlist
- **Group allowlists**: when `groups` is set, it becomes a group allowlist (include `"*"` to allow all)
- **Elevated exec is gated**: `tools.elevated.enabled` + `tools.elevated.allowFrom.<provider>` must both allow
- **Sandbox non-main sessions**: set `agents.defaults.sandbox.mode="non-main"` to run group/channel sessions in Docker

## Channel-specific notes

### WhatsApp

- Link the device: `openclaw channels login` (stores creds in `~/.openclaw/credentials`)
- Allowlist who can talk via `channels.whatsapp.allowFrom`
- If `channels.whatsapp.groups` is set, it becomes a group allowlist (include `"*"` to allow all)

### Telegram

- Set `TELEGRAM_BOT_TOKEN` or `channels.telegram.botToken` (env wins)
- Optional: set `channels.telegram.groups` (with `channels.telegram.groups."*".requireMention`)
- When set, it is a group allowlist (include `"*"` to allow all)

### Discord

- Set `DISCORD_BOT_TOKEN` or `channels.discord.token` (env wins)
- Optional: set `commands.native`, `commands.text`, or `commands.useAccessGroups`
- Plus `channels.discord.dm.allowFrom`, `channels.discord.guilds`, or `channels.discord.mediaMaxMb` as needed

### Slack

- Set `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` (or `channels.slack.botToken` + `channels.slack.appToken`)

### Signal

- Requires `signal-cli` and a `channels.signal` config section

### iMessage

- macOS only; Messages must be signed in
- If `channels.imessage.groups` is set, it becomes a group allowlist (include `"*"` to allow all)

### Microsoft Teams

- Configure a Teams app + Bot Framework, then add a `msteams` config section
- Allowlist who can talk via `msteams.allowFrom`
- Group access via `msteams.groupAllowFrom` or `msteams.groupPolicy="open"`
