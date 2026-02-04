---
name: openclaw
description: OpenClaw personal AI assistant platform. Covers the Gateway control plane, CLI workflows, tools (browser/canvas/nodes), sandboxing + security controls, model/auth failover, and remote access patterns.
metadata:
  source: https://github.com/openclaw/openclaw
  generated: create-skill-from-repo
---

# OpenClaw Skill

Agent-oriented reference for **OpenClaw**: a local-first personal AI assistant with a **Gateway** control plane, multi-channel inbox, first-class tools (browser/canvas/nodes/cron/sessions), and optional Docker sandboxing.

## Core

| Topic | Description | Reference |
|-------|-------------|-----------|
| Overview | What OpenClaw is, key subsystems, quick start | [core-overview](references/core-overview.md) |
| CLI | Essential CLI commands for onboarding, running, health checks, messaging | [core-cli](references/core-cli.md) |
| Architecture | Gateway, sessions, agents, nodes, and where execution happens | [core-architecture](references/core-architecture.md) |
| Configuration | Where config/state lives, key files, and high-signal settings | [core-configuration](references/core-configuration.md) |

## Features

| Topic | Description | Reference |
|-------|-------------|-----------|
| Channels & pairing | DM pairing posture, allowlists, and “why my bot doesn’t reply” | [features-channels-pairing](references/features-channels-pairing.md) |
| Tools | Tool surface (profiles, allow/deny), and what each tool does | [features-tools](references/features-tools.md) |
| Sandboxing | Docker sandbox modes, scope, workspace access, and images | [features-sandboxing](references/features-sandboxing.md) |
| Models & failover | Model selection, auth profile rotation, and fallback rules | [features-models-failover](references/features-models-failover.md) |

## Advanced

| Topic | Description | Reference |
|-------|-------------|-----------|
| Sandbox vs tool policy vs elevated | The “why is this blocked?” mental model and fix-it keys | [advanced-sandbox-tool-policy-elevated](references/advanced-sandbox-tool-policy-elevated.md) |
| Remote access | SSH tunnels, tailnets, Tailscale Serve/Funnel, and safe exposure | [advanced-remote-access](references/advanced-remote-access.md) |

## When to use this skill

- Implementing or operating an OpenClaw Gateway (local or remote)
- Designing tool policy + sandbox posture for multi-channel inputs
- Debugging “no reply” issues (pairing, auth profiles, model allowlists)
- Working with browser/canvas/nodes tools and remote device nodes
