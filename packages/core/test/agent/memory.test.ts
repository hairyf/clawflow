/**
 * A/B tests: clawflow agent/memory ↔ nanobot agent/memory.py
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryStore } from '../../src/agent/memory'

describe('memoryStore (nanobot a/b)', () => {
  let workspace: string

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'clawflow-memory-'))
    mkdirSync(join(workspace, 'memory'), { recursive: true })
  })

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  it('get_today_file returns path with YYYY-MM-DD', () => {
    const store = new MemoryStore(workspace)
    const path = store.get_today_file()
    expect(path).toMatch(/\d{4}-\d{2}-\d{2}\.md$/)
  })

  it('read_today returns empty when file missing', () => {
    const store = new MemoryStore(workspace)
    expect(store.read_today()).toBe('')
  })

  it('append_today and read_today', () => {
    const store = new MemoryStore(workspace)
    store.append_today('note 1')
    expect(store.read_today()).toContain('note 1')
    store.append_today('note 2')
    expect(store.read_today()).toContain('note 2')
  })

  it('read_long_term and write_long_term', () => {
    const store = new MemoryStore(workspace)
    expect(store.read_long_term()).toBe('')
    store.write_long_term('# Memory\nimportant')
    expect(store.read_long_term()).toBe('# Memory\nimportant')
  })

  it('get_recent_memories returns joined content', () => {
    const store = new MemoryStore(workspace)
    store.append_today('today')
    const recent = store.get_recent_memories(7)
    expect(recent).toContain('today')
    // "---" only appears when multiple days exist
    expect(recent.length).toBeGreaterThan(0)
  })

  it('list_memory_files returns sorted full paths to YYYY-MM-DD.md files', () => {
    const store = new MemoryStore(workspace)
    const today = new Date().toISOString().slice(0, 10)
    writeFileSync(join(workspace, 'memory', `${today}.md`), 'x')
    const list = store.list_memory_files()
    expect(list.length).toBeGreaterThanOrEqual(1)
    expect(list[0]).toMatch(/\d{4}-\d{2}-\d{2}\.md$/)
  })

  it('get_memory_context combines long-term and today', () => {
    const store = new MemoryStore(workspace)
    store.write_long_term('long')
    store.append_today('today')
    const ctx = store.get_memory_context()
    expect(ctx).toContain('Long-term Memory')
    expect(ctx).toContain('Today\'s Notes')
    expect(ctx).toContain('long')
    expect(ctx).toContain('today')
  })
})
