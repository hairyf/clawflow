/**
 * Session management for conversation history (JSONL).
 * @see sources/nanobot/nanobot/session/manager.py
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'pathe'
import { getSessionsPath, safeFilename } from '../utils/helpers'

export interface SessionMessage {
  role: string
  content: string
  timestamp?: string
  [key: string]: unknown
}

export interface Session {
  key: string
  messages: SessionMessage[]
  createdAt: string
  updatedAt: string
  metadata: Record<string, unknown>
}

function nowIso(): string {
  return new Date().toISOString()
}

export class SessionManager {
  private sessionsDir: string
  private cache = new Map<string, Session>()

  constructor(_workspace?: string) {
    this.sessionsDir = getSessionsPath()
  }

  private sessionPath(key: string): string {
    const safe = safeFilename(key.replace(':', '_'))
    return join(this.sessionsDir, `${safe}.jsonl`)
  }

  getOrCreate(key: string): Session {
    const cached = this.cache.get(key)
    if (cached)
      return cached
    const loaded = this.load(key)
    const session: Session = loaded ?? {
      key,
      messages: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      metadata: {},
    }
    this.cache.set(key, session)
    return session
  }

  private load(key: string): Session | null {
    const path = this.sessionPath(key)
    if (!existsSync(path))
      return null
    try {
      const lines = readFileSync(path, 'utf-8').split('\n').filter(Boolean)
      const messages: SessionMessage[] = []
      let metadata: Record<string, unknown> = {}
      let createdAt = nowIso()
      for (const line of lines) {
        const data = JSON.parse(line) as Record<string, unknown>
        if (data._type === 'metadata') {
          metadata = (data.metadata as Record<string, unknown>) ?? {}
          createdAt = (data.created_at as string) ?? createdAt
        }
        else {
          messages.push(data as SessionMessage)
        }
      }
      return {
        key,
        messages,
        createdAt,
        updatedAt: nowIso(),
        metadata,
      }
    }
    catch {
      return null
    }
  }

  addMessage(session: Session, role: string, content: string): void {
    session.messages.push({
      role,
      content,
      timestamp: nowIso(),
    })
    session.updatedAt = nowIso()
  }

  getHistory(session: Session, maxMessages = 50): Array<{ role: string, content: string }> {
    const recent = session.messages.slice(-maxMessages)
    return recent.map(m => ({ role: m.role, content: m.content }))
  }

  save(session: Session): void {
    const path = this.sessionPath(session.key)
    mkdirSync(dirname(path), { recursive: true })
    const lines: string[] = [
      JSON.stringify({
        _type: 'metadata',
        created_at: session.createdAt,
        updated_at: session.updatedAt,
        metadata: session.metadata,
      }),
      ...session.messages.map(m => JSON.stringify(m)),
    ]
    writeFileSync(path, lines.join('\n'), 'utf-8')
    this.cache.set(session.key, session)
  }
}
