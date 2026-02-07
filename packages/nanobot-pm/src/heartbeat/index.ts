/**
 * Heartbeat service: periodic agent wake-up to check HEARTBEAT.md.
 * @see sources/nanobot/nanobot/heartbeat/service.py
 */

import { existsSync, readFileSync } from 'node:fs'
import { consola } from 'consola'
import { join } from 'pathe'

export const DEFAULT_HEARTBEAT_INTERVAL_S = 30 * 60

export const HEARTBEAT_PROMPT = `Read HEARTBEAT.md in your workspace (if it exists).
Follow any instructions or tasks listed there.
If nothing needs attention, reply with just: HEARTBEAT_OK`

const HEARTBEAT_OK_TOKEN = 'HEARTBEAT_OK'

function isHeartbeatEmpty(content: string | null): boolean {
  if (!content)
    return true
  const skipPatterns = ['- [ ]', '* [ ]', '- [x]', '* [x]']
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.startsWith('<!--'))
      continue
    if (skipPatterns.includes(t))
      continue
    return false
  }
  return true
}

export type OnHeartbeatCallback = (prompt: string) => Promise<string>

export interface HeartbeatServiceOptions {
  workspace: string
  onHeartbeat: OnHeartbeatCallback | null
  intervalS?: number
  enabled?: boolean
}

export class HeartbeatService {
  private workspace: string
  onHeartbeat: OnHeartbeatCallback | null
  private intervalS: number
  private enabled: boolean
  private running = false
  private timeoutId: ReturnType<typeof setTimeout> | null = null

  constructor(options: HeartbeatServiceOptions) {
    this.workspace = options.workspace
    this.onHeartbeat = options.onHeartbeat ?? null
    this.intervalS = options.intervalS ?? DEFAULT_HEARTBEAT_INTERVAL_S
    this.enabled = options.enabled ?? true
  }

  get heartbeatFilePath(): string {
    return join(this.workspace, 'HEARTBEAT.md')
  }

  private readHeartbeatFile(): string | null {
    const path = this.heartbeatFilePath
    if (!existsSync(path))
      return null
    try {
      return readFileSync(path, 'utf-8')
    }
    catch {
      return null
    }
  }

  start(): void {
    if (!this.enabled) {
      consola.info('Heartbeat disabled')
      return
    }
    this.running = true
    this.scheduleNext()
    consola.info(`Heartbeat started (every ${this.intervalS}s)`)
  }

  stop(): void {
    this.running = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  private scheduleNext(): void {
    if (!this.running || this.timeoutId)
      return
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null
      if (this.running)
        this.tick().then(() => this.scheduleNext())
    }, this.intervalS * 1000)
  }

  private async tick(): Promise<void> {
    const content = this.readHeartbeatFile()
    if (isHeartbeatEmpty(content)) {
      consola.debug('Heartbeat: no tasks (HEARTBEAT.md empty)')
      return
    }
    consola.info('Heartbeat: checking for tasks...')
    if (!this.onHeartbeat)
      return
    try {
      const response = await this.onHeartbeat(HEARTBEAT_PROMPT)
      const normalized = response.toUpperCase().replace(/_/g, '')
      if (normalized.includes(HEARTBEAT_OK_TOKEN.replace(/_/g, ''))) {
        consola.info('Heartbeat: OK (no action needed)')
      }
      else {
        consola.info('Heartbeat: completed task')
      }
    }
    catch (e) {
      consola.error('Heartbeat execution failed:', e)
    }
  }

  /** Manually trigger a heartbeat run. */
  async triggerNow(): Promise<string | null> {
    if (this.onHeartbeat)
      return await this.onHeartbeat(HEARTBEAT_PROMPT)
    return null
  }
}
