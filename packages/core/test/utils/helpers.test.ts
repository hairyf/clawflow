/**
 * A/B tests: clawflow utils/helpers ↔ nanobot utils/helpers.py
 * Reference: sources/nanobot/nanobot/utils/helpers.py
 */

import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { describe, expect, it } from 'vitest'
import {
  ensure_dir,
  get_workspace_path,
  parse_session_key,
  safe_filename,
  timestamp,
  today_date,
  truncate_string,
} from '../../src/utils/helpers'

describe('truncate_string (nanobot a/b)', () => {
  it('returns unchanged string when within maxLen', () => {
    expect(truncate_string('hello', 10)).toBe('hello')
    expect(truncate_string('', 100)).toBe('')
  })

  it('truncates and appends suffix when over maxLen', () => {
    const s = 'a'.repeat(150)
    expect(truncate_string(s, 100)).toBe(`${'a'.repeat(97)}...`)
  })

  it('default maxLen=100, suffix=...', () => {
    const s = 'x'.repeat(101)
    expect(truncate_string(s)).toBe(`${'x'.repeat(97)}...`)
  })
})

describe('parse_session_key (nanobot a/b)', () => {
  it('parses "channel:chat_id" format', () => {
    expect(parse_session_key('telegram:123')).toEqual(['telegram', '123'])
    expect(parse_session_key('discord:guild:channel')).toEqual(['discord', 'guild:channel'])
  })

  it('throws on invalid format (no colon)', () => {
    expect(() => parse_session_key('invalid')).toThrow(/Invalid session key/)
  })

  it('throws on empty key', () => {
    expect(() => parse_session_key('')).toThrow(/Invalid session key/)
  })
})

describe('safe_filename (nanobot a/b)', () => {
  it('replaces unsafe chars with underscore', () => {
    // < > : " / \ | ? * = 9 chars
    expect(safe_filename('file<>:"/\\|?*name')).toBe('file_________name')
  })

  it('trims whitespace', () => {
    expect(safe_filename('  ok  ')).toBe('ok')
  })
})

describe('ensure_dir (nanobot a/b)', () => {
  it('creates directory and returns path', () => {
    const dir = mkdtempSync(join(tmpdir(), 'ensure-'))
    const sub = join(dir, 'nested', 'path')
    const result = ensure_dir(sub)
    expect(result).toBe(sub)
    expect(existsSync(sub)).toBe(true)
    rmSync(dir, { recursive: true, force: true })
  })
})

describe('get_workspace_path (nanobot a/b)', () => {
  it('returns workspace path for custom dir', () => {
    const result = get_workspace_path('/tmp/my-ws')
    expect(result).toContain('my-ws')
  })
})

describe('today_date / timestamp', () => {
  it('today_date returns YYYY-MM-DD', () => {
    const d = today_date()
    expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('timestamp returns ISO format', () => {
    const t = timestamp()
    expect(t).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
