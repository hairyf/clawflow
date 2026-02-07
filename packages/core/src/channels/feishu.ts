/**
 * Feishu/Lark channel: REST send. Receive requires lark-oapi WebSocket (optional).
 * @see sources/nanobot/nanobot/channels/feishu.py
 */

import type { OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { FeishuChannelConfig } from '../config/schema'
import { consola } from 'consola'
import { ofetch } from 'ofetch'
import { BaseChannel } from './base'

const FEISHU_API = 'https://open.feishu.cn/open-apis'

export class FeishuChannel extends BaseChannel {
  name = 'feishu'
  protected override config: FeishuChannelConfig
  private _accessToken: string | null = null
  private _tokenExpires = 0

  constructor(config: FeishuChannelConfig, bus: MessageBus) {
    super(config, bus)
    this.config = config
  }

  private async getAccessToken(): Promise<string | null> {
    if (this._accessToken && Date.now() < this._tokenExpires - 60_000)
      return this._accessToken
    const appId = this.config.appId
    const appSecret = this.config.appSecret
    if (!appId || !appSecret)
      return null
    try {
      const res = await ofetch<{ tenant_access_token?: string, expire?: number }>(
        `${FEISHU_API}/auth/v3/tenant_access_token/internal`,
        {
          method: 'POST',
          body: { app_id: appId, app_secret: appSecret },
        },
      )
      this._accessToken = res.tenant_access_token ?? null
      this._tokenExpires = Date.now() + (res.expire ?? 7200) * 1000
      return this._accessToken
    }
    catch (e) {
      consola.error('Feishu get tenant_access_token failed:', e)
      return null
    }
  }

  async start(): Promise<void> {
    if (!this.config.appId || !this.config.appSecret) {
      consola.error('Feishu appId and appSecret not configured')
      return
    }
    this._running = true
    consola.info('Feishu channel started (send-only; for receive use lark-oapi WebSocket in a separate service)')
    while (this._running) {
      await new Promise(r => setTimeout(r, 5000))
    }
  }

  async stop(): Promise<void> {
    this._running = false
    this._accessToken = null
  }

  async send(msg: OutboundMessage): Promise<void> {
    const token = await this.getAccessToken()
    if (!token) {
      consola.warn('Feishu client not initialized (no access token)')
      return
    }
    const receiveIdType = msg.chat_id.startsWith('oc_') ? 'chat_id' : 'open_id'
    const content = JSON.stringify({ text: msg.content })
    try {
      await ofetch(`${FEISHU_API}/im/v1/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        query: { receive_id_type: receiveIdType },
        body: {
          receive_id: msg.chat_id,
          msg_type: 'text',
          content,
        },
      })
    }
    catch (e) {
      consola.error('Error sending Feishu message:', e)
    }
  }
}
