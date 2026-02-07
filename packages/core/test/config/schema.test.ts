/**
 * A/B tests: nanobot-pm config/schema ↔ nanobot config/schema.py
 */

import { describe, expect, it } from 'vitest'
import { defaultConfig } from '../../src/config/schema'

describe('defaultConfig (nanobot a/b)', () => {
  it('has agents.defaults', () => {
    expect(defaultConfig.agents?.defaults?.workspace).toBeDefined()
    expect(defaultConfig.agents?.defaults?.model).toContain('claude')
    expect(defaultConfig.agents?.defaults?.maxTokens).toBe(8192)
  })

  it('has tools config', () => {
    expect(defaultConfig.tools?.web?.search?.maxResults).toBe(5)
    expect(defaultConfig.tools?.exec?.timeout).toBe(60)
  })

  it('has channels', () => {
    expect(defaultConfig.channels?.telegram).toBeDefined()
    expect(defaultConfig.channels?.whatsapp?.bridgeUrl).toBeDefined()
  })

  it('has gateway and bridge', () => {
    expect(defaultConfig.gateway?.port).toBe(18790)
    expect(defaultConfig.bridge?.port).toBe(3001)
  })
})
