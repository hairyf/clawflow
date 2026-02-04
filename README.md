# clawflow

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![bundle][bundle-src]][bundle-href]
[![JSDocs][jsdocs-src]][jsdocs-href]
[![License][license-src]][license-href]

工程化、项目绑定的 AI 工作流与多 Agent 编排，基于 [OpenClaw](https://github.com/openclaw/openclaw)。将 OpenClaw 的能力与软件工程实践结合：工作区与状态绑定到项目目录，AI 生成物可追踪、可审查、可协作。

## 快速开始

```bash
# 创建项目脚手架
pnpx clawflow create my-app
cd my-app

# 启动 OpenClaw Gateway（需已安装 openclaw）
clawflow gateway start

# 或启动 TUI
clawflow tui
```

## 命令

| 命令 | 说明 |
|------|------|
| `clawflow create <project-name>` | 创建项目脚手架（含 `.openclaw/`、`src/` 等，配置由 OpenClaw 接管） |
| `clawflow gateway [start\|status\|stop\|restart]` | 委托 openclaw gateway |
| `clawflow tui` | 委托 openclaw tui |
| `clawflow status` / `clawflow health` / `clawflow doctor` | 委托 openclaw 健康检查 |
| `clawflow channels` / `clawflow pairing` / `clawflow cron` / `clawflow sessions` | 委托 openclaw 对应子命令 |
| `clawflow sandbox` / `clawflow models` / `clawflow nodes` / `clawflow browser` | 委托 openclaw 对应子命令 |
| `clawflow openclaw -- <args>` | 透传至 openclaw |

## 配置

配置由 **OpenClaw 接管**：项目内直接使用 `.openclaw/openclaw.json`。`clawflow create` 会生成最小配置（`$include` + `agents.defaults.workspace`），其余按 [OpenClaw 配置](https://github.com/openclaw/openclaw) 编辑该文件即可。

## 依赖

- 需已安装 [OpenClaw](https://github.com/openclaw/openclaw)（`openclaw` CLI）以使用 gateway、tui、sessions 等委托命令。

## Note for Developers

This starter recommands using [npm Trusted Publisher](https://github.com/e18e/ecosystem-issues/issues/201), where the release is done on CI to ensure the security of the packages.

To do so, you need to run `pnpm publish` manually for the very first time to create the package on npm, and then go to `https://www.npmjs.com/package/<your-package-name>/access` to set the connection to your GitHub repo.

Then for the future releases, you can run `pnpm run release` to do the release and the GitHub Actions will take care of the release process.

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/antfu/static/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © [Hairyf](https://github.com/hairyf)

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
