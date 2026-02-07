/**
 * Event types for the message bus.
 * @see sources/nanobot/nanobot/bus/events.py
 */

export interface InboundMessage {
  /** Channel: telegram, discord, cli, etc. */
  channel: string
  /** User identifier */
  senderId: string
  /** Chat/channel identifier */
  chatId: string
  /** Message text */
  content: string
  /** ISO timestamp */
  timestamp?: string
  /** Media URLs */
  media?: string[]
  /** Channel-specific data */
  metadata?: Record<string, unknown>
}

export function getSessionKey(msg: InboundMessage): string {
  return `${msg.channel}:${msg.chatId}`
}

export interface OutboundMessage {
  channel: string
  chatId: string
  content: string
  replyTo?: string
  media?: string[]
  metadata?: Record<string, unknown>
}
