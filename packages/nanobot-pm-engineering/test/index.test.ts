import { describe, expect, it } from 'vitest'
import { run } from '../src/index'

describe('nanobot-pm-engineering', () => {
  it('exports run', () => {
    expect(typeof run).toBe('function')
  })
})
