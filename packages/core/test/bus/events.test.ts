/**
 * A/B tests: nanobot-pm bus/events ↔ nanobot bus/events.py
 */

import type { InboundMessage, OutboundMessage } from '../../src/bus/events'
import { describe, expect, it } from 'vitest'
import { get_session_key } from '../../src/bus/events'

describe('get_session_key (nanobot a/b)', () => {
  it('returns channel:chat_id format', () => {
    const msg: InboundMessage = { channel: 'telegram', sender_id: 'u1', chat_id: '123', content: 'hi' }
    expect(get_session_key(msg)).toBe('telegram:123')
  })

  it('handles chat_id with colons', () => {
    const msg: InboundMessage = { channel: 'discord', sender_id: 'u1', chat_id: 'guild:channel', content: '' }
    expect(get_session_key(msg)).toBe('discord:guild:channel')
  })
})

describe('outboundMessage', () => {
  it('has expected shape', () => {
    const msg: OutboundMessage = { channel: 'cli', chat_id: 'main', content: 'hello' }
    expect(msg.channel).toBe('cli')
    expect(msg.chat_id).toBe('main')
    expect(msg.content).toBe('hello')
  })
})
