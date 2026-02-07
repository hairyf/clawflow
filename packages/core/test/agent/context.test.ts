/**
 * A/B tests: clawflow agent/context ↔ nanobot agent/context.py
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ContextBuilder } from '../../src/agent/context'

describe('contextBuilder (nanobot a/b)', () => {
  let workspace: string

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'clawflow-context-'))
    mkdirSync(join(workspace, 'memory'), { recursive: true })
  })

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  it('buildSystemPrompt includes workspace and runtime', () => {
    const ctx = new ContextBuilder(workspace)
    const prompt = ctx.buildSystemPrompt()
    expect(prompt).toContain('ClawFlow')
    expect(prompt).toContain(workspace)
    expect(prompt).toContain('memory')
    expect(prompt).toContain('Memory')
  })

  it('buildUserContent returns text when no media', () => {
    const ctx = new ContextBuilder(workspace)
    expect(ctx.buildUserContent('hello')).toBe('hello')
    expect(ctx.buildUserContent('hi', [])).toBe('hi')
  })

  it('addAssistantMessage and addToolResult', () => {
    const ctx = new ContextBuilder(workspace)
    const messages: Array<Record<string, unknown>> = []
    ctx.addAssistantMessage(messages, 'ok')
    expect(messages).toHaveLength(1)
    expect(messages[0]!.role).toBe('assistant')
    expect(messages[0]!.content).toBe('ok')

    ctx.addToolResult(messages, 'tc1', 'read_file', 'file contents')
    expect(messages).toHaveLength(2)
    expect(messages[1]!.role).toBe('tool')
    expect((messages[1] as any).tool_call_id).toBe('tc1')
    expect((messages[1] as any).content).toBe('file contents')
  })

  it('addAssistantMessage with toolCalls', () => {
    const ctx = new ContextBuilder(workspace)
    const messages: Array<Record<string, unknown>> = []
    ctx.addAssistantMessage(messages, null, [
      { id: 'tc1', name: 'read_file', arguments: { path: '/x' } },
    ])
    expect((messages[0] as any).tool_calls).toHaveLength(1)
    expect((messages[0] as any).tool_calls[0].function.name).toBe('read_file')
  })

  it('buildUserContent with valid image media returns image_url + text (nanobot _build_user_content)', () => {
    const ctx = new ContextBuilder(workspace)
    const imgPath = join(workspace, 'test.png')
    writeFileSync(imgPath, 'fake-png')
    const result = ctx.buildUserContent('caption', [imgPath])
    expect(Array.isArray(result)).toBe(true)
    expect((result as any)[0].type).toBe('image_url')
    expect((result as any)[0].image_url.url).toMatch(/^data:image\/png;base64,/)
    expect((result as any).some((p: any) => p.type === 'text' && p.text === 'caption')).toBe(true)
  })

  it('build_messages includes session note when channel and chat_id provided (nanobot)', () => {
    const ctx = new ContextBuilder(workspace)
    const msgs = ctx.build_messages({ history: [], currentMessage: 'hi', channel: 'telegram', chat_id: '123' })
    const system = msgs.find(m => m.role === 'system')!.content as string
    expect(system).toContain('Current Session')
    expect(system).toContain('telegram')
    expect(system).toContain('123')
  })
})
