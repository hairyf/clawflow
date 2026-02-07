/**
 * A/B tests: clawflow agent/tools/message ↔ nanobot agent/tools/message.py
 */

import { describe, expect, it } from 'vitest'
import { messageTool } from '../../../src/agent/tools/message'

describe('messageTool (nanobot a/b)', () => {
  it('returns error without context', async () => {
    const tool = messageTool()
    const r = await tool.execute({ content: 'hi' })
    expect(r).toContain('No target')
  })

  it('sends via callback when context set', async () => {
    const sent: Array<{ channel: string, chat_id: string, content: string }> = []
    const tool = messageTool(async (msg) => {
      sent.push({ channel: msg.channel, chat_id: msg.chat_id, content: msg.content })
    })
    tool.set_context('telegram', '123')
    const r = await tool.execute({ content: 'hello' })
    expect(r).toContain('Message sent')
    expect(sent).toHaveLength(1)
    expect(sent[0]!.channel).toBe('telegram')
    expect(sent[0]!.chat_id).toBe('123')
    expect(sent[0]!.content).toBe('hello')
  })

  it('returns error when send callback throws', async () => {
    const tool = messageTool(async () => {
      throw new Error('send failed')
    })
    tool.set_context('t', 'c')
    const r = await tool.execute({ content: 'x' })
    expect(r).toContain('Error')
  })

  it('accepts inline channel/chat_id', async () => {
    const sent: Array<{ channel: string, chat_id: string }> = []
    const tool = messageTool(async (msg) => {
      sent.push(msg)
    })
    await tool.execute({ content: 'x', channel: 'discord', chat_id: 'guild:c' })
    expect(sent[0]!.channel).toBe('discord')
    expect(sent[0]!.chat_id).toBe('guild:c')
  })
})
