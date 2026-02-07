/**
 * WhatsApp channel: connects to Node.js bridge via WebSocket.
 * Bridge uses @whiskeysockets/baileys; see sources/nanobot/bridge.
 * @see sources/nanobot/nanobot/channels/whatsapp.py
 */

import type Buffer from 'node:buffer'
import type { OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { WhatsAppChannelConfig } from '../config/schema'
import { consola } from 'consola'
import WebSocket from 'ws'
import { BaseChannel } from './base'

export class WhatsAppChannel extends BaseChannel {
  name = 'whatsapp'
  protected override config: WhatsAppChannelConfig
  private _ws: WebSocket | null = null
  private _connected = false

  constructor(config: WhatsAppChannelConfig, bus: MessageBus) {
    super(config, bus)
    this.config = config
  }

  async start(): Promise<void> {
    const bridgeUrl = this.config.bridgeUrl ?? 'ws://localhost:3001'
    consola.info(`Connecting to WhatsApp bridge at ${bridgeUrl}...`)
    this._running = true

    while (this._running) {
      try {
        await new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(bridgeUrl)
          ws.on('open', () => {
            this._ws = ws
            this._connected = true
            consola.info('Connected to WhatsApp bridge')
            resolve()
          })
          ws.on('message', (data: Buffer) => {
            this._handleBridgeMessage(data.toString()).catch(e => consola.error('Bridge message error:', e))
          })
          ws.on('close', () => {
            this._ws = null
            this._connected = false
          })
          ws.on('error', reject)
        })

        while (this._running && this._ws?.readyState === WebSocket.OPEN) {
          await new Promise(r => setTimeout(r, 500))
        }
      }
      catch (e) {
        this._ws = null
        this._connected = false
        if (this._running) {
          consola.warn('WhatsApp bridge connection error:', e)
          consola.info('Reconnecting in 5 seconds...')
          await new Promise(r => setTimeout(r, 5000))
        }
      }
    }
  }

  async stop(): Promise<void> {
    this._running = false
    this._connected = false
    if (this._ws) {
      this._ws.close()
      this._ws = null
    }
  }

  async send(msg: OutboundMessage): Promise<void> {
    if (!this._ws || this._ws.readyState !== WebSocket.OPEN) {
      consola.warn('WhatsApp bridge not connected')
      return
    }
    try {
      const payload = JSON.stringify({
        type: 'send',
        to: msg.chatId,
        text: msg.content,
      })
      this._ws.send(payload)
    }
    catch (e) {
      consola.error('Error sending WhatsApp message:', e)
    }
  }

  private async _handleBridgeMessage(raw: string): Promise<void> {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      const msgType = data.type as string

      if (msgType === 'message') {
        const sender = (data.sender as string) ?? ''
        let content = (data.content as string) ?? ''
        const chatId = sender.includes('@') ? sender.split('@')[0] : sender
        if (content === '[Voice Message]')
          content = '[Voice Message: Transcription not available for WhatsApp yet]'

        await this.handleMessage(
          chatId,
          sender,
          content,
          [],
          {
            messageId: data.id,
            timestamp: data.timestamp,
            isGroup: data.isGroup ?? false,
          },
        )
      }
      else if (msgType === 'status') {
        const status = data.status as string
        consola.info('WhatsApp status:', status)
        if (status === 'connected')
          this._connected = true
        else if (status === 'disconnected')
          this._connected = false
      }
      else if (msgType === 'qr') {
        consola.info('Scan QR code in the bridge terminal to connect WhatsApp')
      }
      else if (msgType === 'error') {
        consola.error('WhatsApp bridge error:', data.error)
      }
    }
    catch {
      consola.warn('Invalid JSON from bridge:', raw.slice(0, 100))
    }
  }
}
