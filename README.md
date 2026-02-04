# clawflow

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

Project-bound AI workflow and multi-Agent orchestration, based on [OpenClaw](https://github.com/openclaw/openclaw), combining OpenClaw's capabilities with software engineering practices: binding the workspace and state to the project directory, making AI artifacts traceable, reviewable, and collaborative.

## Quick Start

```bash
# Create project scaffold
pnpx clawflow create my-app
cd my-app

# Start OpenClaw Gateway (requires openclaw installed)
clawflow gateway start

# Or start TUI
clawflow tui
```

## Commands

| Command | Description |
|------|------|
| `clawflow create <project-name>` | Create project scaffold (`.openclaw/`, `src/`, etc.; config managed by OpenClaw) |
| `clawflow gateway [start\|status\|stop\|restart]` | Delegate to openclaw gateway |
| `clawflow tui` | Delegate to openclaw tui |
| `clawflow status` / `clawflow health` / `clawflow doctor` | Delegate to openclaw health check |
| `clawflow channels` / `clawflow pairing` / `clawflow cron` / `clawflow sessions` | Delegate to openclaw corresponding subcommands |
| `clawflow sandbox` / `clawflow models` / `clawflow nodes` / `clawflow browser` | Delegate to openclaw corresponding subcommands |
| `clawflow openclaw -- <args>` | Pass through to openclaw |

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/clawflow?style=flat&colorA=080f12&colorB=1fa669
[npm-version-href]: https://npmjs.com/package/clawflow
[npm-downloads-src]: https://img.shields.io/npm/dm/clawflow?style=flat&colorA=080f12&colorB=1fa669
[npm-downloads-href]: https://npmjs.com/package/clawflow
[bundle-src]: https://img.shields.io/bundlephobia/minzip/clawflow?style=flat&colorA=080f12&colorB=1fa669&label=minzip
[bundle-href]: https://bundlephobia.com/result?p=clawflow
[license-src]: https://img.shields.io/github/license/antfu/clawflow.svg?style=flat&colorA=080f12&colorB=1fa669
[license-href]: https://github.com/antfu/clawflow/blob/main/LICENSE
[jsdocs-src]: https://img.shields.io/badge/jsdocs-reference-080f12?style=flat&colorA=080f12&colorB=1fa669
[jsdocs-href]: https://www.jsdocs.io/package/clawflow
