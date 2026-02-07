# nanobot Skill

基于 [HKUDS/nanobot](https://github.com/HKUDS/nanobot) 的轻量个人 AI 助手架构与实现要点。适用于需要理解或复刻 nanobot 式 Agent（消息总线、多渠道、工具循环、记忆与技能）时查阅。

## Core

| 主题 | 说明 | 参考 |
|------|------|------|
| 架构概览 | 项目结构、数据流、Bus/Agent/Channels 解耦 | [core-architecture](references/core-architecture.md) |
| Agent Loop | 消息处理循环、默认 tools、process_direct | [core-agent-loop](references/core-agent-loop.md) |
| Context | 系统提示、bootstrap、memory、skills 注入 | [core-context](references/core-context.md) |
| Tools | Tool 基类、Registry、内置工具、自定义扩展 | [core-tools](references/core-tools.md) |
| Config | Schema、加载/保存、按模型选 provider、安全项 | [core-config](references/core-config.md) |

## Features

| 主题 | 说明 | 参考 |
|------|------|------|
| Message Bus | Inbound/Outbound、订阅与 dispatch | [features-bus](references/features-bus.md) |
| Cron | 定时任务类型、payload、CLI、on_job 注入 | [features-cron](references/features-cron.md) |
| Providers | LLM 抽象、多 provider、vLLM 本地 | [features-providers](references/features-providers.md) |
| Memory | 长期/每日记忆、get_memory_context | [features-memory](references/features-memory.md) |
| Skills | 发现、依赖、always 注入、summary | [features-skills](references/features-skills.md) |
| Channels | Telegram/Discord/WhatsApp/Feishu、配置与 gateway | [features-channels](references/features-channels.md) |

## Advanced

| 主题 | 说明 | 参考 |
|------|------|------|
| CLI | 命令表、cron 子命令、配置路径 | [advanced-cli](references/advanced-cli.md) |
| Security | restrictToWorkspace、allowFrom、exec 安全 | [advanced-security](references/advanced-security.md) |

## 使用说明

- 本 skill 的 `references/` 为 Agent 向文档，按「概念 + 代码片段 + 源码路径」组织。
- 实现或对比 nanobot-pm 与 nanobot 时，可优先读 Core 再按需查 Features/Advanced。
- 源码以仓库 `sources/nanobot` 为准；上游: https://github.com/HKUDS/nanobot
