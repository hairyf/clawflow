---
source: https://github.com/HKUDS/nanobot
title: Channels 渠道
category: features
---

# Channels：多端接入

渠道（Telegram、Discord、WhatsApp、Feishu）将用户消息转为 `InboundMessage` 推入 bus，并订阅 `OutboundMessage` 发回用户。Gateway 启动各 channel 与 bus 的 dispatch。

## 配置要点

- **telegram**：`enabled`、`token`（BotFather）、`allow_from`（user ID 白名单）、可选 `proxy`
- **discord**：`enabled`、`token`、`allow_from`、`gateway_url`、`intents`
- **whatsapp**：需 bridge（Node），`enabled`、`bridge_url`、`allow_from`；先 `nanobot channels login` 扫码
- **feishu**：`enabled`、`app_id`、`app_secret`；长连接模式无需公网 IP

## 安全

- `channels.*.allowFrom`：空表示允许所有人；非空则仅列出的 ID 可交互。
- 生产环境可配合 `tools.restrictToWorkspace` 限制 Agent 能力。

## 运行

```bash
nanobot gateway
```

- 各 channel 连接后向 `bus.publish_inbound(...)` 投递消息。
- 单独线程/任务运行 `bus.dispatch_outbound()`，按 `msg.channel` 分发给对应 channel 的发送逻辑。

## 参考

- 源码: `nanobot/channels/`（base、telegram、discord、feishu、whatsapp、manager）
- README: <https://github.com/HKUDS/nanobot#-chat-apps>
