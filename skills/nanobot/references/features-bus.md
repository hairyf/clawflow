---
source: https://github.com/HKUDS/nanobot
title: Message Bus
category: features
---

# Message Bus：消息路由

MessageBus 解耦「渠道」与「Agent」：渠道只负责推入/拉取消息，不关心 Agent 实现。

## 事件类型

```python
from nanobot.bus.events import InboundMessage, OutboundMessage

# 入站：渠道 → Agent
InboundMessage(
    channel="telegram",
    sender_id="123456",
    chat_id="123456",
    content="Hello",
    media=[],      # 可选
    metadata={},   # 可选
)
# session_key = f"{channel}:{chat_id}"

# 出站：Agent → 渠道
OutboundMessage(
    channel="telegram",
    chat_id="123456",
    content="Hi there",
    reply_to=None,
    media=[],
    metadata={},
)
```

## MessageBus API

```python
bus = MessageBus()

# 入站
await bus.publish_inbound(msg)
msg = await bus.consume_inbound()   # 阻塞直到有消息

# 出站
await bus.publish_outbound(msg)
msg = await bus.consume_outbound()

# 按 channel 订阅出站（Gateway 用）
bus.subscribe_outbound("telegram", callback)   # callback: OutboundMessage -> Awaitable[None]
await bus.dispatch_outbound()   # 循环：取 outbound -> 按 channel 调订阅者
bus.stop()
```

## 参考

- 源码: `nanobot/bus/events.py`, `nanobot/bus/queue.py`
