/**
 * Async message bus: decouples channels from agent.
 * @see sources/nanobot/nanobot/bus/queue.py
 */

import type { InboundMessage, OutboundMessage } from './events.js'
import { consola } from 'consola'

export type OutboundCallback = (msg: OutboundMessage) => Promise<void>

export class MessageBus {
  private inbound: InboundMessage[] = []
  private outbound: OutboundMessage[] = []
  private outboundSubscribers: Map<string, OutboundCallback[]> = new Map()
  private resolveInbound: (() => void) | null = null
  private resolveOutbound: (() => void) | null = null
  private _running = false

  async publishInbound(msg: InboundMessage): Promise<void> {
    this.inbound.push(msg)
    this.resolveInbound?.()
    this.resolveInbound = null
  }

  async consumeInbound(): Promise<InboundMessage> {
    for (;;) {
      const msg = this.inbound.shift()
      if (msg)
        return msg
      await new Promise<void>((resolve) => {
        this.resolveInbound = resolve
      })
    }
  }

  async publishOutbound(msg: OutboundMessage): Promise<void> {
    this.outbound.push(msg)
    this.resolveOutbound?.()
    this.resolveOutbound = null
  }

  async consumeOutbound(): Promise<OutboundMessage> {
    for (;;) {
      const msg = this.outbound.shift()
      if (msg)
        return msg
      await new Promise<void>((resolve) => {
        this.resolveOutbound = resolve
      })
    }
  }

  subscribeOutbound(channel: string, callback: OutboundCallback): void {
    const list = this.outboundSubscribers.get(channel) ?? []
    list.push(callback)
    this.outboundSubscribers.set(channel, list)
  }

  async dispatchOutbound(): Promise<void> {
    this._running = true
    while (this._running) {
      try {
        const msg = await Promise.race([
          this.consumeOutbound(),
          new Promise<OutboundMessage>((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 1000),
          ),
        ])
        const subscribers = this.outboundSubscribers.get(msg.channel) ?? []
        for (const cb of subscribers) {
          try {
            await cb(msg)
          }
          catch (e) {
            consola.error(`Error dispatching to ${msg.channel}:`, e)
          }
        }
      }
      catch {
        // timeout or empty – continue loop
      }
    }
  }

  stop(): void {
    this._running = false
  }

  get inboundSize(): number {
    return this.inbound.length
  }

  get outboundSize(): number {
    return this.outbound.length
  }
}
