/**
 * A/B tests: nanobot-pm agent/subagent ↔ nanobot agent/subagent.py
 */

import type { LLMProvider } from '../../src/providers/base'
import { describe, expect, it } from 'vitest'
import { SubagentManager } from '../../src/agent/subagent'
import { MessageBus } from '../../src/bus/queue'

function mockProvider(): LLMProvider {
  return {
    getDefaultModel: () => 'test-model',
    chat: async () => ({ content: 'done', toolCalls: [] }),
  }
}

describe('subagentManager (nanobot a/b)', () => {
  it('getRunningCount returns 0 initially', () => {
    const bus = new MessageBus()
    const mgr = new SubagentManager({
      provider: mockProvider(),
      workspace: '/tmp',
      bus,
    })
    expect(mgr.getRunningCount()).toBe(0)
  })

  it('spawn returns expected message format', async () => {
    const bus = new MessageBus()
    const mgr = new SubagentManager({
      provider: mockProvider(),
      workspace: '/tmp',
      bus,
    })
    const result = await mgr.spawn('do something', 'label', 'telegram', '123')
    expect(result).toContain('Subagent')
    expect(result).toContain('started')
    expect(result).toContain('id:')
    expect(result).toContain('I\'ll notify you when it completes')
  })
})
