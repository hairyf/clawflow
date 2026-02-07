/**
 * Base channel interface for chat platforms.
 * @see sources/nanobot/nanobot/channels/base.py
 */

import type { InboundMessage, OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { ChannelConfig } from '../config/schema'
import { consola } from 'consola'

export type { ChannelConfig }

export abstract class BaseChannel {
  abstract name: string

  constructor(
    protected config: ChannelConfig,
    protected bus: MessageBus,
  ) {}

  protected _running = false

  get isRunning(): boolean {
    return this._running
  }

  abstract start(): Promise<void>
  abstract stop(): Promise<void>
  abstract send(msg: OutboundMessage): Promise<void>

  isAllowed(sender_id: string): boolean {
    const allowFrom = this.config.allowFrom ?? []
    if (allowFrom.length === 0)
      return true
    const senderStr = String(sender_id)
    if (allowFrom.includes(senderStr))
      return true
    if (senderStr.includes('|')) {
      for (const part of senderStr.split('|')) {
        if (part && allowFrom.includes(part))
          return true
      }
    }
    return false
  }

  protected async handleMessage(
    sender_id: string,
    chat_id: string,
    content: string,
    media: string[] = [],
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.isAllowed(sender_id)) {
      consola.warn(
        `Access denied for sender ${sender_id} on channel ${this.name}. `
        + 'Add them to allowFrom in config to grant access.',
      )
      return
    }
    const msg: InboundMessage = {
      channel: this.name,
      sender_id: String(sender_id),
      chat_id: String(chat_id),
      content,
      timestamp: new Date().toISOString(),
      media: media ?? [],
      metadata: metadata ?? {},
    }
    await this.bus.publishInbound(msg)
  }
}
