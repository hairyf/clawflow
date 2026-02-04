---
title: Models & Failover
category: features
source: https://github.com/openclaw/openclaw/blob/main/docs/concepts/models.md
---

# Models & Failover

Model selection, auth profile rotation, and fallback rules.

## How model selection works

OpenClaw selects models in this order:

1. **Primary** model (`agents.defaults.model.primary` or `agents.defaults.model`)
2. **Fallbacks** in `agents.defaults.model.fallbacks` (in order)
3. **Provider auth failover** happens inside a provider before moving to the next model

Related:

- `agents.defaults.models` is the allowlist/catalog of models OpenClaw can use (plus aliases)
- `agents.defaults.imageModel` is used **only when** the primary model can't accept images
- Per-agent defaults can override `agents.defaults.model` via `agents.list[].model` plus bindings

## Auth storage (keys + OAuth)

OpenClaw uses **auth profiles** for both API keys and OAuth tokens.

- Secrets live in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (legacy: `~/.openclaw/agent/auth-profiles.json`)
- Config `auth.profiles` / `auth.order` are **metadata + routing only** (no secrets)
- Legacy import-only OAuth file: `~/.openclaw/credentials/oauth.json` (imported into `auth-profiles.json` on first use)

Credential types:

- `type: "api_key"` → `{ provider, key }`
- `type: "oauth"` → `{ provider, access, refresh, expires, email? }` (+ `projectId`/`enterpriseUrl` for some providers)

## Profile IDs

OAuth logins create distinct profiles so multiple accounts can coexist.

- Default: `provider:default` when no email is available
- OAuth with email: `provider:<email>` (for example `google-antigravity:user@gmail.com`)

Profiles live in `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` under `profiles`.

## Rotation order

When a provider has multiple profiles, OpenClaw chooses an order like this:

1. **Explicit config**: `auth.order[provider]` (if set)
2. **Configured profiles**: `auth.profiles` filtered by provider
3. **Stored profiles**: entries in `auth-profiles.json` for the provider

If no explicit order is configured, OpenClaw uses a round-robin order:

- **Primary key**: profile type (**OAuth before API keys**)
- **Secondary key**: `usageStats.lastUsed` (oldest first, within each type)
- **Cooldown/disabled profiles** are moved to the end, ordered by soonest expiry

## Session stickiness (cache-friendly)

OpenClaw **pins the chosen auth profile per session** to keep provider caches warm. It does **not** rotate on every request. The pinned profile is reused until:

- the session is reset (`/new` / `/reset`)
- a compaction completes (compaction count increments)
- the profile is in cooldown/disabled

Manual selection via `/model …@<profileId>` sets a **user override** for that session and is not auto-rotated until a new session starts.

Auto-pinned profiles (selected by the session router) are treated as a **preference**: they are tried first, but OpenClaw may rotate to another profile on rate limits/timeouts.

User-pinned profiles stay locked to that profile; if it fails and model fallbacks are configured, OpenClaw moves to the next model instead of switching profiles.

## Cooldowns

When a profile fails due to auth/rate-limit errors (or a timeout that looks like rate limiting), OpenClaw marks it in cooldown and moves to the next profile.

Cooldowns use exponential backoff:

- 1 minute
- 5 minutes
- 25 minutes
- 1 hour (cap)

State is stored in `auth-profiles.json` under `usageStats`:

```json
{
  "usageStats": {
    "provider:profile": {
      "lastUsed": 1736160000000,
      "cooldownUntil": 1736160600000,
      "errorCount": 2
    }
  }
}
```

## Billing disables

Billing/credit failures (for example "insufficient credits" / "credit balance too low") are treated as failover-worthy, but they're usually not transient. Instead of a short cooldown, OpenClaw marks the profile as **disabled** (with a longer backoff) and rotates to the next profile/provider.

State is stored in `auth-profiles.json`:

```json
{
  "usageStats": {
    "provider:profile": {
      "disabledUntil": 1736178000000,
      "disabledReason": "billing"
    }
  }
}
```

Defaults:

- Billing backoff starts at **5 hours**, doubles per billing failure, and caps at **24 hours**
- Backoff counters reset if the profile hasn't failed for **24 hours** (configurable)

## Model fallback

If all profiles for a provider fail, OpenClaw moves to the next model in `agents.defaults.model.fallbacks`. This applies to auth failures, rate limits, and timeouts that exhausted profile rotation (other errors do not advance fallback).

When a run starts with a model override (hooks or CLI), fallbacks still end at `agents.defaults.model.primary` after trying any configured fallbacks.

## Switching models in chat (`/model`)

You can switch models for the current session without restarting:

```
/model
/model list
/model 3
/model openai/gpt-5.2
/model status
```

Notes:

- `/model` (and `/model list`) is a compact, numbered picker (model family + available providers)
- `/model <#>` selects from that picker
- `/model status` is the detailed view (auth candidates and, when configured, provider endpoint `baseUrl` + `api` mode)
- Model refs are parsed by splitting on the **first** `/`. Use `provider/model` when typing `/model <ref>`
- If the model ID itself contains `/` (OpenRouter-style), you must include the provider prefix (example: `/model openrouter/moonshotai/kimi-k2`)
- If you omit the provider, OpenClaw treats the input as an alias or a model for the **default provider** (only works when there is no `/` in the model ID)

## "Model is not allowed" (and why replies stop)

If `agents.defaults.models` is set, it becomes the **allowlist** for `/model` and for session overrides. When a user selects a model that isn't in that allowlist, OpenClaw returns:

```
Model "provider/model" is not allowed. Use /model to list available models.
```

This happens **before** a normal reply is generated, so the message can feel like it "didn't respond." The fix is to either:

- Add the model to `agents.defaults.models`, or
- Clear the allowlist (remove `agents.defaults.models`), or
- Pick a model from `/model list`

Example allowlist config:

```json5
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-5" },
    models: {
      "anthropic/claude-sonnet-4-5": { alias: "Sonnet" },
      "anthropic/claude-opus-4-5": { alias: "Opus" },
    },
  },
}
```

## CLI commands

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

## Preferred Anthropic auth

Preferred Anthropic auth is the Claude Code CLI setup-token (run anywhere; paste on the gateway host if needed):

```bash
claude setup-token
openclaw models status
```
