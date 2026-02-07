/**
 * A/B tests: clawflow agent/tools/cron ↔ nanobot agent/tools/cron.py
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cronTool } from '../../../src/agent/tools/cron'
import { CronService } from '../../../src/cron/service'

describe('cronTool (nanobot a/b)', () => {
  let storePath: string
  let service: CronService
  let tool: ReturnType<typeof cronTool>

  beforeEach(async () => {
    storePath = join(mkdtempSync(join(tmpdir(), 'clawflow-cron-')), 'jobs.json')
    service = new CronService(storePath)
    await service.start()
    tool = cronTool(service)
  })

  afterEach(async () => {
    service.stop()
    rmSync(join(storePath, '..'), { recursive: true, force: true })
  })

  it('add requires message and context', async () => {
    let result = await tool.execute({ action: 'add' })
    expect(result).toContain('message is required')

    tool.set_context('telegram', '123')
    result = await tool.execute({ action: 'add', message: 'hi' })
    expect(result).toContain('every_seconds or cron_expr')

    result = await tool.execute({ action: 'add', message: 'remind me', every_seconds: 60 })
    expect(result).toContain('Created job')

    result = await tool.execute({ action: 'add', message: 'cron job', cron_expr: '0 9 * * *' })
    expect(result).toContain('Created job')
  })

  it('list returns jobs', async () => {
    let result = await tool.execute({ action: 'list' })
    expect(result).toContain('No scheduled jobs')

    tool.set_context('t', 'c')
    await tool.execute({ action: 'add', message: 'x', every_seconds: 60 })
    result = await tool.execute({ action: 'list' })
    expect(result).toContain('Scheduled jobs')
  })

  it('remove requires job_id', async () => {
    const result = await tool.execute({ action: 'remove' })
    expect(result).toContain('job_id is required')
  })
})
