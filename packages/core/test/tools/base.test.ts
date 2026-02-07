/**
 * A/B tests: nanobot-pm validate_tool_params ↔ nanobot agent/tools/base.py validate_params
 * Reference: sources/nanobot/tests/test_tool_validation.py
 */

import type { Tool, ToolParameterSchema } from '../../src/agent/tools/base'
import { describe, expect, it } from 'vitest'
import {

  tool_to_schema,
  validate_tool_params,
} from '../../src/agent/tools/base'

/** Sample schema matching nanobot test_tool_validation.SampleTool.parameters */
const SAMPLE_SCHEMA: ToolParameterSchema = {
  type: 'object',
  properties: {
    query: { type: 'string', minLength: 2 },
    count: { type: 'integer', minimum: 1, maximum: 10 },
    mode: { type: 'string', enum: ['fast', 'full'] },
    meta: {
      type: 'object',
      properties: {
        tag: { type: 'string' },
        flags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['tag'],
    },
  },
  required: ['query', 'count'],
}

describe('validate_tool_params (nanobot a/b)', () => {
  it('missing required: returns error containing "missing required count"', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, { query: 'hi' })
    expect(errors.join('; ')).toContain('missing required count')
  })

  it('type and range: count=0 returns error about count >= 1', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, { query: 'hi', count: 0 })
    expect(errors.some(e => e.includes('count') && e.includes('>= 1'))).toBe(true)
  })

  it('type and range: count as string returns integer type error', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, { query: 'hi', count: '2' })
    expect(errors.some(e => e.includes('integer'))).toBe(true)
  })

  it('enum and minLength: query too short and mode invalid', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, {
      query: 'h',
      count: 2,
      mode: 'slow',
    })
    expect(errors.some(e => e.includes('query') && e.includes('2 chars'))).toBe(true)
    expect(errors.some(e => e.includes('mode') && e.includes('one of'))).toBe(true)
  })

  it('nested object and array: missing meta.tag, flags item type', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, {
      query: 'hi',
      count: 2,
      meta: { flags: [1, 'ok'] },
    })
    expect(errors.some(e => e.includes('meta.tag'))).toBe(true)
    expect(errors.some(e => e.includes('meta.flags') && e.includes('string'))).toBe(true)
  })

  it('ignores unknown fields: extra keys produce no errors', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, {
      query: 'hi',
      count: 2,
      extra: 'x',
    })
    expect(errors).toHaveLength(0)
  })

  it('valid params: returns empty array', () => {
    const errors = validate_tool_params(SAMPLE_SCHEMA, {
      query: 'hi',
      count: 2,
    })
    expect(errors).toHaveLength(0)
  })
})

describe('tool_to_schema (nanobot a/b)', () => {
  it('produces OpenAI function schema format', () => {
    const tool: Tool = {
      name: 'sample',
      description: 'sample tool',
      parameters: SAMPLE_SCHEMA,
      execute: async () => 'ok',
    }
    const def = tool_to_schema(tool)
    expect(def).toEqual({
      type: 'function',
      function: {
        name: 'sample',
        description: 'sample tool',
        parameters: SAMPLE_SCHEMA,
      },
    })
  })
})
