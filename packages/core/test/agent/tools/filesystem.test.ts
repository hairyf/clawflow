/**
 * A/B tests: nanobot-pm agent/tools/filesystem ↔ nanobot agent/tools/filesystem.py
 */

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  editFileTool,
  listDirTool,
  readFileTool,
  writeFileTool,
} from '../../../src/agent/tools/filesystem'

describe('filesystem tools (nanobot a/b)', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'nanobot-pm-fs-'))
    writeFileSync(join(dir, 'a.txt'), 'hello')
    mkdirSync(join(dir, 'subdir'), { recursive: true })
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('read_file reads content', async () => {
    const tool = readFileTool(dir)
    const r = await tool.execute({ path: join(dir, 'a.txt') })
    expect(r).toBe('hello')
  })

  it('read_file returns error for missing file', async () => {
    const tool = readFileTool(dir)
    const r = await tool.execute({ path: join(dir, 'nonexistent.txt') })
    expect(r).toContain('not found')
  })

  it('write_file creates file', async () => {
    const tool = writeFileTool(dir)
    const p = join(dir, 'new.txt')
    const r = await tool.execute({ path: p, content: 'world' })
    expect(r).toContain('Successfully wrote')
    expect(readFileSync(p, 'utf-8')).toBe('world')
  })

  it('edit_file replaces old_text', async () => {
    const tool = editFileTool(dir)
    const p = join(dir, 'a.txt')
    const r = await tool.execute({ path: p, old_text: 'hello', new_text: 'hi' })
    expect(r).toContain('Successfully edited')
    expect(readFileSync(p, 'utf-8')).toBe('hi')
  })

  it('edit_file errors when old_text not found', async () => {
    const tool = editFileTool(dir)
    const r = await tool.execute({ path: join(dir, 'a.txt'), old_text: 'xyz', new_text: 'a' })
    expect(r).toContain('old_text not found')
  })

  it('list_dir lists entries', async () => {
    const tool = listDirTool(dir)
    const r = await tool.execute({ path: dir })
    expect(r).toContain('a.txt')
    expect(r).toContain('subdir')
  })

  it('respects allowed_dir - rejects path outside', async () => {
    const tool = readFileTool(dir)
    const r = await tool.execute({ path: '/etc/passwd' })
    expect(r).toContain('Error')
    expect(r).toContain('outside')
  })
})
