/**
 * A/B tests: nanobot-pm ToolRegistry ↔ nanobot agent/tools/registry.py
 * Reference: sources/nanobot/tests/test_tool_validation.py test_registry_returns_validation_error
 */

import type { Tool, ToolParameterSchema } from '../../src/agent/tools/base'
import { describe, expect, it } from 'vitest'
import { ToolRegistry } from '../../src/agent/tools/registry'

const SAMPLE_SCHEMA: ToolParameterSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', minLength: 2 },
    count: { type: 'integer', minimum: 1, maximum: 10 },
  },
  required: ['query', 'count'],
}

const sampleTool: Tool = {
  name: 'sample',
  description: 'sample tool',
  parameters: SAMPLE_SCHEMA,
  execute: async () => 'ok',
}

describe('toolRegistry (nanobot a/b)', () => {
  it('execute with invalid params returns error containing "Invalid parameters"', async () => {
    const reg = new ToolRegistry()
    reg.register(sampleTool)
    const result = await reg.execute('sample', { query: 'hi' })
    expect(result).toContain('Invalid parameters')
  })

  it('execute with valid params returns tool result', async () => {
    const reg = new ToolRegistry()
    reg.register(sampleTool)
    const result = await reg.execute('sample', { query: 'hi', count: 2 })
    expect(result).toBe('ok')
  })

  it('execute unknown tool returns not found error', async () => {
    const reg = new ToolRegistry()
    const result = await reg.execute('unknown', {})
    expect(result).toContain('not found')
  })

  it('execute returns error when tool throws (nanobot)', async () => {
    const reg = new ToolRegistry()
    reg.register({
      ...sampleTool,
      execute: async () => { throw new Error('tool failed') },
    })
    const result = await reg.execute('sample', { query: 'hi', count: 2 })
    expect(result).toContain('Error executing')
  })

  it('register/unregister/has/toolNames', () => {
    const reg = new ToolRegistry()
    reg.register(sampleTool)
    expect(reg.has('sample')).toBe(true)
    expect(reg.toolNames).toContain('sample')
    reg.unregister('sample')
    expect(reg.has('sample')).toBe(false)
    expect(reg.toolNames).not.toContain('sample')
  })
})
