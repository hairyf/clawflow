/**
 * Event types for the message bus.
 * @see sources/nanobot/nanobot/bus/events.py
 */

export interface InboundMessage {
  /** Channel: telegram, discord, cli, etc. */
  channel: string
  /** User identifier */
  sender_id: string
  /** Chat/channel identifier */
  chat_id: string
  /** Message text */
  content: string
  /** ISO timestamp */
  timestamp?: string
  /** Media URLs */
  media?: string[]
  /** Channel-specific data */
  metadata?: Record<string, unknown>
}

export function get_session_key(msg: InboundMessage): string {
  return `${msg.channel}:${msg.chat_id}`
}

export interface OutboundMessage {
  channel: string
  chat_id: string
  content: string
  replyTo?: string
  media?: string[]
  metadata?: Record<string, unknown>
}
