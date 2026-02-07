/**
 * A/B tests: clawflow bus/queue ↔ nanobot bus/queue.py
 */

import type { InboundMessage, OutboundMessage } from '../../src/bus/events'
import { describe, expect, it } from 'vitest'
import { MessageBus } from '../../src/bus/queue'

describe('messageBus (nanobot a/b)', () => {
  it('publishInbound and consumeInbound', async () => {
    const bus = new MessageBus()
    const msg: InboundMessage = { channel: 'cli', sender_id: 'u1', chat_id: 'main', content: 'test' }
    const consumed = Promise.all([
      bus.consumeInbound(),
      (async () => {
        await Promise.resolve()
        await bus.publishInbound(msg)
      })(),
    ])
    const [received] = await consumed
    expect(received).toEqual(msg)
  })

  it('publishOutbound and consumeOutbound', async () => {
    const bus = new MessageBus()
    const msg: OutboundMessage = { channel: 'cli', chat_id: 'main', content: 'reply' }
    const consumed = Promise.all([
      bus.consumeOutbound(),
      (async () => {
        await Promise.resolve()
        await bus.publishOutbound(msg)
      })(),
    ])
    const [received] = await consumed
    expect(received).toEqual(msg)
  })

  it('inboundSize and outboundSize', async () => {
    const bus = new MessageBus()
    const msg: InboundMessage = { channel: 'x', sender_id: 'u', chat_id: 'c', content: 'm' }
    await bus.publishInbound(msg)
    await bus.publishInbound(msg)
    expect(bus.inboundSize).toBe(2)
    const m1 = await bus.consumeInbound()
    expect(m1).toBeTruthy()
    expect(bus.inboundSize).toBe(1)
  })

  it('subscribeOutbound dispatches to callback', async () => {
    const bus = new MessageBus()
    const received: OutboundMessage[] = []
    bus.subscribeOutbound('cli', async (m) => {
      received.push(m)
    })
    const stopPromise = bus.dispatchOutbound()
    await bus.publishOutbound({ channel: 'cli', chat_id: 'c', content: 'hi' })
    await new Promise(r => setTimeout(r, 50))
    bus.stop()
    await stopPromise
    expect(received).toHaveLength(1)
    expect(received[0]!.content).toBe('hi')
  })
})
