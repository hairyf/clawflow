/**
 * Voice transcription provider using Groq Whisper API.
 * @see sources/nanobot/nanobot/providers/transcription.py
 */

import { existsSync, readFileSync } from 'node:fs'
import { basename } from 'node:path'
import process from 'node:process'
import { consola } from 'consola'
import { ofetch } from 'ofetch'

const GROQ_TRANSCRIPTIONS_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const DEFAULT_MODEL = 'whisper-large-v3'

export interface TranscriptionProvider {
  transcribe: (filePath: string) => Promise<string>
}

export interface GroqTranscriptionProviderOptions {
  apiKey?: string
  model?: string
}

/**
 * Voice transcription using Groq's Whisper API.
 * Groq offers fast transcription with a generous free tier.
 */
export class GroqTranscriptionProvider implements TranscriptionProvider {
  private apiKey: string
  private model: string

  constructor(options: GroqTranscriptionProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.GROQ_API_KEY ?? ''
    this.model = options.model ?? DEFAULT_MODEL
  }

  async transcribe(filePath: string): Promise<string> {
    if (!this.apiKey) {
      consola.warn('Groq API key not configured for transcription')
      return ''
    }
    if (!existsSync(filePath)) {
      consola.error('Audio file not found:', filePath)
      return ''
    }

    try {
      const buffer = readFileSync(filePath)
      const blob = new Blob([buffer])
      const form = new FormData()
      form.append('file', blob, basename(filePath))
      form.append('model', this.model)

      const data = await ofetch<{ text?: string }>(GROQ_TRANSCRIPTIONS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: form,
        timeout: 60_000,
      })
      return data?.text ?? ''
    }
    catch (e) {
      consola.error('Groq transcription error:', e)
      return ''
    }
  }
}
