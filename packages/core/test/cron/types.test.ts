/**
 * A/B tests: clawflow cron/types ↔ nanobot cron/types.py
 */

import type { CronPayload, CronSchedule } from '../../src/cron/types'
import { describe, expect, it } from 'vitest'

describe('cronSchedule (nanobot a/b)', () => {
  it('at kind', () => {
    const s: CronSchedule = { kind: 'at', at_ms: 12345 }
    expect(s.kind).toBe('at')
    expect(s.at_ms).toBe(12345)
  })

  it('every kind', () => {
    const s: CronSchedule = { kind: 'every', every_ms: 60000 }
    expect(s.every_ms).toBe(60000)
  })

  it('cron kind', () => {
    const s: CronSchedule = { kind: 'cron', expr: '0 9 * * *' }
    expect(s.expr).toBe('0 9 * * *')
  })
})

describe('cronPayload', () => {
  it('agent_turn shape', () => {
    const p: CronPayload = {
      kind: 'agent_turn',
      message: 'reminder',
      deliver: true,
      channel: 'telegram',
      to: '123',
    }
    expect(p.kind).toBe('agent_turn')
    expect(p.deliver).toBe(true)
  })
})
