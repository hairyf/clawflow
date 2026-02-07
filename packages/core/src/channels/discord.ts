/**
 * Discord channel: Gateway WebSocket + REST API for send.
 * @see sources/nanobot/nanobot/channels/discord.py
 */

import type Buffer from 'node:buffer'
import type { OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { DiscordChannelConfig } from '../config/schema'
import { consola } from 'consola'
import { ofetch } from 'ofetch'
import WebSocket from 'ws'
import { BaseChannel } from './base'

const DISCORD_API = 'https://discord.com/api/v10'
const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024

export class DiscordChannel extends BaseChannel {
  name = 'discord'
  protected override config: DiscordChannelConfig
  private _ws: WebSocket | null = null
  private _seq: number | null = null
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: DiscordChannelConfig, bus: MessageBus) {
    super(config, bus)
    this.config = config
  }

  async start(): Promise<void> {
    const token = this.config.token
    if (!token) {
      consola.error('Discord bot token not configured')
      return
    }
    this._running = true
    const gatewayUrl = this.config.gatewayUrl ?? 'wss://gateway.discord.gg/?v=10&encoding=json'

    while (this._running) {
      try {
        const ws = new WebSocket(gatewayUrl)
        await new Promise<void>((resolve, reject) => {
          ws.on('open', resolve)
          ws.on('error', reject)
        })
        this._ws = ws
        consola.info('Connected to Discord gateway')

        const onMessage = (data: Buffer): void => {
          try {
            const parsed = JSON.parse(data.toString()) as { op?: number, t?: string, s?: number, d?: unknown }
            const { op, t, s, d } = parsed
            if (s != null)
              this._seq = s
            if (op === 10) {
              const interval = (d as { heartbeat_interval?: number })?.heartbeat_interval ?? 45000
              this._startHeartbeat(interval / 1000)
              this._identify()
            }
            else if (op === 0 && t === 'READY') {
              consola.info('Discord gateway READY')
            }
            else if (op === 0 && t === 'MESSAGE_CREATE') {
              this._handleMessageCreate(d as Record<string, unknown>).catch(e => consola.warn('Discord handle message:', e))
            }
            else if (op === 7 || op === 9) {
              ws.removeListener('message', onMessage)
              ws.close()
            }
          }
          catch (e) {
            consola.warn('Discord gateway parse error:', e)
          }
        }
        ws.on('message', onMessage)

        await new Promise<void>((resolve) => {
          ws.on('close', resolve)
          ws.on('error', () => resolve())
        })

        this._stopHeartbeat()
        this._ws = null
      }
      catch (e) {
        if (this._running) {
          consola.warn('Discord gateway error:', e)
          await new Promise(r => setTimeout(r, 5000))
        }
      }
    }
  }

  private _startHeartbeat(intervalSec: number): void {
    this._stopHeartbeat()
    this._heartbeatTimer = setInterval(() => {
      if (this._ws?.readyState === WebSocket.OPEN)
        this._ws.send(JSON.stringify({ op: 1, d: this._seq }))
    }, intervalSec * 1000)
  }

  private _stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer)
      this._heartbeatTimer = null
    }
  }

  private _identify(): void {
    this._ws?.send(JSON.stringify({
      op: 2,
      d: {
        token: this.config.token,
        intents: this.config.intents ?? 37377,
        properties: { os: 'clawflow', browser: 'clawflow', device: 'clawflow' },
      },
    }))
  }

  private async _handleMessageCreate(payload: Record<string, unknown>): Promise<void> {
    const author = payload.author as Record<string, unknown> | undefined
    if (author?.bot)
      return
    const senderId = String(author?.id ?? '')
    const channelId = String(payload.channel_id ?? '')
    const content = (payload.content as string) ?? ''
    if (!senderId || !channelId)
      return
    if (!this.isAllowed(senderId))
      return

    const parts: string[] = content ? [content] : []
    const attachments = (payload.attachments as Array<{ url?: string, filename?: string, size?: number, id?: string }>) ?? []
    for (const att of attachments) {
      if (att.size && att.size > MAX_ATTACHMENT_BYTES) {
        parts.push(`[attachment: ${att.filename ?? 'file'} - too large]`)
        continue
      }
      parts.push(`[attachment: ${att.url ?? att.filename ?? 'file'}]`)
    }

    await this.handleMessage(
      senderId,
      channelId,
      parts.filter(Boolean).join('\n') || '[empty message]',
      [],
      {
        messageId: payload.id,
        guildId: payload.guild_id,
        replyTo: (payload.referenced_message as Record<string, unknown>)?.id,
      },
    )
  }

  async stop(): Promise<void> {
    this._running = false
    this._stopHeartbeat()
    if (this._ws) {
      this._ws.close()
      this._ws = null
    }
  }

  async send(msg: OutboundMessage): Promise<void> {
    const token = this.config.token
    if (!token)
      return
    const url = `${DISCORD_API}/channels/${msg.chatId}/messages`
    const body: Record<string, unknown> = { content: msg.content }
    if (msg.replyTo) {
      body.message_reference = { message_id: msg.replyTo }
      body.allowed_mentions = { replied_user: false }
    }
    try {
      await ofetch(url, {
        method: 'POST',
        headers: { Authorization: `Bot ${token}` },
        body,
      })
    }
    catch (e: any) {
      if (e?.status === 429) {
        const retryAfter = (e?.data?.retry_after ?? 1) as number
        consola.warn(`Discord rate limited, retry in ${retryAfter}s`)
        await new Promise(r => setTimeout(r, retryAfter * 1000))
        return this.send(msg)
      }
      consola.error('Error sending Discord message:', e)
    }
  }
}
