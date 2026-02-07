/**
 * Telegram channel: Bot API long polling (getUpdates).
 * No extra SDK; uses fetch for getUpdates + sendMessage.
 * Voice/audio messages are transcribed via Groq Whisper when configured.
 * @see sources/nanobot/nanobot/channels/telegram.py
 */

import type { OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { TelegramChannelConfig } from '../config/schema'
import type { TranscriptionProvider } from '../providers/transcription'
import { Buffer } from 'node:buffer'
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { consola } from 'consola'
import { join } from 'pathe'
import { GroqTranscriptionProvider } from '../providers/transcription'
import { BaseChannel } from './base'

const TELEGRAM_API = 'https://api.telegram.org'

function extensionForMedia(mediaType: string, mimeType?: string): string {
  if (mimeType) {
    const map: Record<string, string> = {
      'audio/ogg': '.ogg',
      'audio/mpeg': '.mp3',
      'audio/mp4': '.m4a',
    }
    if (map[mimeType])
      return map[mimeType]
  }
  const typeMap: Record<string, string> = { voice: '.ogg', audio: '.mp3' }
  return typeMap[mediaType] ?? '.ogg'
}

function markdownToTelegramHtml(text: string): string {
  if (!text)
    return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/__(.+?)__/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export class TelegramChannel extends BaseChannel {
  name = 'telegram'
  protected override config: TelegramChannelConfig
  private transcriber: TranscriptionProvider | null
  private _offset = 0
  private _abort: AbortController | null = null

  constructor(config: TelegramChannelConfig, bus: MessageBus, groqApiKey = '') {
    super(config, bus)
    this.config = config
    this.transcriber = groqApiKey ? new GroqTranscriptionProvider({ apiKey: groqApiKey }) : null
  }

  private apiUrl(path: string): string {
    const token = this.config.token ?? ''
    return `${TELEGRAM_API}/bot${token}${path}`
  }

  async start(): Promise<void> {
    const token = this.config.token
    if (!token) {
      consola.error('Telegram bot token not configured')
      return
    }
    this._running = true
    this._abort = new AbortController()

    try {
      const me = await fetch(this.apiUrl('/getMe'), { signal: this._abort.signal }).then(
        r => r.json() as Promise<{ ok?: boolean, description?: string, result?: { username?: string } }>,
      )
      if (me.ok !== true)
        consola.warn('Telegram getMe failed:', me.description)
      else
        consola.info(`Telegram bot @${me.result?.username ?? '?'} connected`)
    }
    catch (e) {
      consola.warn('Telegram getMe error:', e)
    }

    while (this._running && this._abort) {
      try {
        const url = `${this.apiUrl('/getUpdates')}?offset=${this._offset}&timeout=30`
        const res = await fetch(url, { signal: this._abort.signal })
        const data = await res.json() as { ok?: boolean, result?: Array<{ update_id: number, message?: Record<string, unknown> }> }
        if (!data.ok || !Array.isArray(data.result))
          continue
        for (const upd of data.result) {
          this._offset = upd.update_id + 1
          const msg = upd.message as Record<string, unknown> | undefined
          if (msg)
            await this._handleUpdate(msg)
        }
      }
      catch (e) {
        if (this._running && (e as Error).name !== 'AbortError')
          consola.warn('Telegram getUpdates error:', e)
      }
    }
  }

  private async _handleUpdate(msg: Record<string, unknown>): Promise<void> {
    const chat = msg.chat as { id?: number, type?: string } | undefined
    const from = msg.from as { id?: number, username?: string, first_name?: string } | undefined
    const chatId = chat?.id
    const userId = from?.id
    if (chatId == null || userId == null)
      return

    const senderId = from?.username ? `${userId}|${from.username}` : String(userId)
    let content = (msg.text as string) ?? (msg.caption as string) ?? ''

    const voice = msg.voice as { file_id?: string, mime_type?: string } | undefined
    const audio = msg.audio as { file_id?: string, mime_type?: string } | undefined
    const media = voice ?? audio
    if (media?.file_id) {
      const transcribed = await this._downloadAndTranscribe(media.file_id, voice ? 'voice' : 'audio', media.mime_type)
      if (transcribed)
        content = content ? `${content}\n[transcription: ${transcribed}]` : `[transcription: ${transcribed}]`
      else
        content = content || `[${voice ? 'voice' : 'audio'}: download/transcribe failed]`
    }

    if (!content)
      content = '[empty message]'

    await this.handleMessage(
      senderId,
      String(chatId),
      content,
      [],
      {
        messageId: msg.message_id,
        userId: from?.id,
        username: from?.username,
        firstName: from?.first_name,
        isGroup: chat?.type !== 'private',
      },
    )
  }

  private async _downloadAndTranscribe(fileId: string, mediaType: string, mimeType?: string): Promise<string> {
    const token = this.config.token
    if (!token)
      return ''
    try {
      const getRes = await fetch(this.apiUrl('/getFile'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_id: fileId }),
      })
      const getData = await getRes.json() as { ok?: boolean, result?: { file_path?: string } }
      if (!getData.ok || !getData.result?.file_path)
        return ''
      const filePath = getData.result.file_path
      const downloadUrl = `${TELEGRAM_API}/file/bot${token}/${filePath}`
      const res = await fetch(downloadUrl, { signal: this._abort?.signal })
      if (!res.ok || !res.body)
        return ''
      const buf = Buffer.from(await res.arrayBuffer())
      const ext = extensionForMedia(mediaType, mimeType)
      const localPath = join(tmpdir(), `clawflow_${fileId.slice(0, 16)}${ext}`)
      writeFileSync(localPath, buf)
      try {
        if (this.transcriber) {
          const text = await this.transcriber.transcribe(localPath)
          if (text)
            consola.info(`Transcribed ${mediaType}: ${text.slice(0, 50)}...`)
          return text
        }
        return ''
      }
      finally {
        if (existsSync(localPath))
          unlinkSync(localPath)
      }
    }
    catch (e) {
      consola.warn('Telegram voice/audio download or transcribe failed:', e)
      return ''
    }
  }

  async stop(): Promise<void> {
    this._running = false
    if (this._abort) {
      this._abort.abort()
      this._abort = null
    }
  }

  async send(msg: OutboundMessage): Promise<void> {
    const token = this.config.token
    if (!token)
      return
    const chatId = msg.chatId
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: msg.content,
      parse_mode: 'HTML',
    }
    try {
      const html = markdownToTelegramHtml(msg.content)
      body.text = html
      const res = await fetch(this.apiUrl('/sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json() as { ok?: boolean, description?: string }
      if (!data.ok)
        consola.warn('Telegram sendMessage failed:', data.description)
    }
    catch (e) {
      consola.warn('Telegram send fallback to plain text:', e)
      try {
        body.parse_mode = undefined
        body.text = msg.content
        await fetch(this.apiUrl('/sendMessage'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      catch (e2) {
        consola.error('Telegram send error:', e2)
      }
    }
  }
}
