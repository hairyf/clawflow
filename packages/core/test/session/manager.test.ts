/**
 * A/B tests: clawflow session/manager ↔ nanobot session/manager.py
 */

import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SessionManager } from '../../src/session/manager'

describe('sessionManager (nanobot a/b)', () => {
  let sessions_dir: string

  beforeEach(() => {
    sessions_dir = mkdtempSync(join(tmpdir(), 'clawflow-sessions-'))
    mkdirSync(sessions_dir, { recursive: true })
  })

  afterEach(() => {
    rmSync(sessions_dir, { recursive: true, force: true })
  })

  it('get_or_create returns new session when none exists', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    const session = mgr.get_or_create('telegram_123')
    expect(session.key).toBe('telegram_123')
    expect(session.messages).toEqual([])
    expect(session.metadata).toEqual({})
    expect(session.created_at).toBeTruthy()
  })

  it('add_message and getHistory', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    const session = mgr.get_or_create('cli_main')
    mgr.add_message(session, 'user', 'hello')
    mgr.add_message(session, 'assistant', 'hi')
    const history = mgr.getHistory(session, 10)
    expect(history).toHaveLength(2)
    expect(history[0]).toEqual({ role: 'user', content: 'hello' })
    expect(history[1]).toEqual({ role: 'assistant', content: 'hi' })
  })

  it('save and load persist session', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    const session = mgr.get_or_create('test_key')
    mgr.add_message(session, 'user', 'msg')
    mgr.save(session)

    const mgr2 = new SessionManager(undefined, sessions_dir)
    const loaded = mgr2.get_or_create('test_key')
    expect(loaded.messages).toHaveLength(1)
    expect(loaded.messages[0]!.content).toBe('msg')
  })

  it('delete removes session', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    const session = mgr.get_or_create('to_delete')
    mgr.save(session)
    const deleted = mgr.delete('to_delete')
    expect(deleted).toBe(true)
    const again = mgr.get_or_create('to_delete')
    expect(again.messages).toHaveLength(0)
  })

  it('clear empties messages and persists', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    const session = mgr.get_or_create('clear_key')
    mgr.add_message(session, 'user', 'x')
    mgr.save(session)
    mgr.clear(session)
    expect(session.messages).toHaveLength(0)
    const mgr2 = new SessionManager(undefined, sessions_dir)
    const reloaded = mgr2.get_or_create('clear_key')
    expect(reloaded.messages).toHaveLength(0)
  })

  it('list_sessions returns sorted items', () => {
    const mgr = new SessionManager(undefined, sessions_dir)
    mgr.get_or_create('a')
    mgr.save(mgr.get_or_create('a'))
    mgr.get_or_create('b')
    mgr.save(mgr.get_or_create('b'))
    const list = mgr.list_sessions()
    expect(list.length).toBeGreaterThanOrEqual(2)
    expect(list.every(s => s.key && s.created_at && s.updated_at)).toBe(true)
  })
})
