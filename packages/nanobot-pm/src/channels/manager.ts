/**
 * Channel manager: init channels from config, start/stop, route outbound.
 * @see sources/nanobot/nanobot/channels/manager.py
 */

import type { MessageBus } from '../bus/queue'
import type { NanobotPmConfig } from '../config/schema'
import type { BaseChannel } from './base'
import { consola } from 'consola'

export class ChannelManager {
  private channels: Map<string, BaseChannel> = new Map()
  private _dispatchTask: Promise<void> | null = null
  private _channelTasks: Promise<void>[] = []
  private _channelsReady = false

  constructor(
    private config: NanobotPmConfig,
    private bus: MessageBus,
  ) {}

  private async _initChannels(): Promise<void> {
    if (this._channelsReady)
      return
    const channelsConfig = this.config.channels ?? {}

    if (channelsConfig.telegram?.enabled) {
      try {
        const { TelegramChannel } = await import('./telegram')
        const groqKey = (this.config.providers?.groq as { apiKey?: string } | undefined)?.apiKey ?? ''
        this.channels.set('telegram', new TelegramChannel(channelsConfig.telegram, this.bus, groqKey))
        consola.info('Telegram channel enabled')
      }
      catch (e) {
        consola.warn('Telegram channel not available:', e)
      }
    }

    if (channelsConfig.whatsapp?.enabled) {
      try {
        const { WhatsAppChannel } = await import('./whatsapp')
        this.channels.set('whatsapp', new WhatsAppChannel(channelsConfig.whatsapp!, this.bus))
        consola.info('WhatsApp channel enabled')
      }
      catch (e) {
        consola.warn('WhatsApp channel not available:', e)
      }
    }

    if (channelsConfig.discord?.enabled) {
      try {
        const { DiscordChannel } = await import('./discord')
        this.channels.set('discord', new DiscordChannel(channelsConfig.discord, this.bus))
        consola.info('Discord channel enabled')
      }
      catch (e) {
        consola.warn('Discord channel not available:', e)
      }
    }

    if (channelsConfig.feishu?.enabled) {
      try {
        const { FeishuChannel } = await import('./feishu')
        this.channels.set('feishu', new FeishuChannel(channelsConfig.feishu, this.bus))
        consola.info('Feishu channel enabled')
      }
      catch (e) {
        consola.warn('Feishu channel not available:', e)
      }
    }
    this._channelsReady = true
  }

  async startAll(): Promise<void> {
    await this._initChannels()
    if (this.channels.size === 0) {
      consola.warn('No channels enabled')
      return
    }

    for (const [name, channel] of this.channels) {
      this.bus.subscribeOutbound(name, msg => channel.send(msg))
    }

    this._dispatchTask = this.bus.dispatchOutbound()
    this._channelTasks = []

    for (const [name, channel] of this.channels) {
      consola.info(`Starting ${name} channel...`)
      this._channelTasks.push(channel.start())
    }

    await Promise.race([
      this._dispatchTask,
      ...this._channelTasks,
    ]).catch(() => {})
  }

  async stopAll(): Promise<void> {
    consola.info('Stopping all channels...')
    this.bus.stop()

    if (this._dispatchTask) {
      this._dispatchTask = null
    }

    for (const [name, channel] of this.channels) {
      try {
        await channel.stop()
        consola.info(`Stopped ${name} channel`)
      }
      catch (e) {
        consola.error(`Error stopping ${name}:`, e)
      }
    }
    this._channelTasks = []
  }

  getChannel(name: string): BaseChannel | undefined {
    return this.channels.get(name)
  }

  getStatus(): Record<string, { enabled: boolean, running: boolean }> {
    const out: Record<string, { enabled: boolean, running: boolean }> = {}
    for (const [name, channel] of this.channels) {
      out[name] = { enabled: true, running: channel.isRunning }
    }
    return out
  }

  get enabledChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}
