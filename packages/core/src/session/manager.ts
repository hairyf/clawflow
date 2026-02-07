/**
 * Session management for conversation history (JSONL).
 * @see sources/nanobot/nanobot/session/manager.py
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'pathe'
import { get_sessions_path, safe_filename } from '../utils/helpers'

export interface SessionMessage {
  role: string
  content: string
  timestamp?: string
  [key: string]: unknown
}

export interface Session {
  key: string
  messages: SessionMessage[]
  created_at: string
  updated_at: string
  metadata: Record<string, unknown>
}

function nowIso(): string {
  return new Date().toISOString()
}

export class SessionManager {
  private sessions_dir: string
  private cache = new Map<string, Session>()

  /** @param _workspace unused, kept for API compatibility. @param sessions_dir override for testing. */
  constructor(_workspace?: string, sessions_dir?: string) {
    this.sessions_dir = sessions_dir ?? get_sessions_path()
  }

  private sessionPath(key: string): string {
    const safe = safe_filename(key.replace(':', '_'))
    return join(this.sessions_dir, `${safe}.jsonl`)
  }

  get_or_create(key: string): Session {
    const cached = this.cache.get(key)
    if (cached)
      return cached
    const loaded = this.load(key)
    const session: Session = loaded ?? {
      key,
      messages: [],
      created_at: nowIso(),
      updated_at: nowIso(),
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
      let created_at = nowIso()
      for (const line of lines) {
        const data = JSON.parse(line) as Record<string, unknown>
        if (data._type === 'metadata') {
          metadata = (data.metadata as Record<string, unknown>) ?? {}
          created_at = (data.created_at as string) ?? created_at
        }
        else {
          messages.push(data as SessionMessage)
        }
      }
      return {
        key,
        messages,
        created_at,
        updated_at: nowIso(),
        metadata,
      }
    }
    catch {
      return null
    }
  }

  add_message(session: Session, role: string, content: string): void {
    session.messages.push({
      role,
      content,
      timestamp: nowIso(),
    })
    session.updated_at = nowIso()
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
        created_at: session.created_at,
        updated_at: session.updated_at,
        metadata: session.metadata,
      }),
      ...session.messages.map(m => JSON.stringify(m)),
    ]
    writeFileSync(path, lines.join('\n'), 'utf-8')
    this.cache.set(session.key, session)
  }

  /** Remove session from cache and delete file. Returns true if file was deleted. */
  delete(key: string): boolean {
    this.cache.delete(key)
    const path = this.sessionPath(key)
    if (existsSync(path)) {
      unlinkSync(path)
      return true
    }
    return false
  }

  /** List all sessions (read metadata from each *.jsonl), sorted by updated_at desc. */
  list_sessions(): SessionListItem[] {
    if (!existsSync(this.sessions_dir))
      return []
    const files = readdirSync(this.sessions_dir).filter(f => f.endsWith('.jsonl'))
    const sessions: SessionListItem[] = []
    for (const file of files) {
      try {
        const path = join(this.sessions_dir, file)
        const content = readFileSync(path, 'utf-8')
        const firstLine = content.split('\n').find(l => l.trim())
        if (!firstLine)
          continue
        const data = JSON.parse(firstLine) as Record<string, unknown>
        if (data._type !== 'metadata')
          continue
        const stem = file.slice(0, -'.jsonl'.length)
        sessions.push({
          key: stem.replace(/_/g, ':'),
          created_at: (data.created_at as string) ?? '',
          updated_at: (data.updated_at as string) ?? '',
          path,
        })
      }
      catch {
        // skip unreadable or invalid files
      }
    }
    return sessions.sort((a, b) => (b.updated_at || '').localeCompare(a.updated_at || ''))
  }

  /** Clear messages and update timestamp; persists to disk. */
  clear(session: Session): void {
    session.messages = []
    session.updated_at = nowIso()
    this.save(session)
  }
}

export interface SessionListItem {
  key: string
  created_at: string
  updated_at: string
  path: string
}
