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

  isAllowed(senderId: string): boolean {
    const allowFrom = this.config.allowFrom ?? []
    if (allowFrom.length === 0)
      return true
    const senderStr = String(senderId)
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
    senderId: string,
    chatId: string,
    content: string,
    media: string[] = [],
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.isAllowed(senderId)) {
      consola.warn(
        `Access denied for sender ${senderId} on channel ${this.name}. `
        + 'Add them to allowFrom in config to grant access.',
      )
      return
    }
    const msg: InboundMessage = {
      channel: this.name,
      senderId: String(senderId),
      chatId: String(chatId),
      content,
      timestamp: new Date().toISOString(),
      media: media ?? [],
      metadata: metadata ?? {},
    }
    await this.bus.publishInbound(msg)
  }
}
