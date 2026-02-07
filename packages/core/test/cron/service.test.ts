/**
 * A/B tests: clawflow cron/service ↔ nanobot cron/service.py
 */

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CronService } from '../../src/cron/service'

describe('cronService (nanobot a/b)', () => {
  let storePath: string

  beforeEach(() => {
    storePath = join(mkdtempSync(join(tmpdir(), 'clawflow-cron-')), 'jobs.json')
  })

  afterEach(() => {
    rmSync(join(storePath, '..'), { recursive: true, force: true })
  })

  it('add_job and list_jobs', async () => {
    const svc = new CronService(storePath)
    await svc.start()
    const job = svc.add_job('test', { kind: 'every', every_ms: 60000 }, 'reminder')
    expect(job.id).toBeTruthy()
    expect(job.name).toBe('test')
    expect(job.enabled).toBe(true)

    const jobs = svc.list_jobs()
    expect(jobs.length).toBeGreaterThanOrEqual(1)
    expect(jobs.some(j => j.id === job.id)).toBe(true)
    svc.stop()
  })

  it('enable_job toggles enabled', async () => {
    const svc = new CronService(storePath)
    await svc.start()
    const job = svc.add_job('t', { kind: 'every', every_ms: 60000 }, 'm')
    const disabled = svc.enable_job(job.id, false)
    expect(disabled?.enabled).toBe(false)
    const list = svc.list_jobs()
    expect(list.some(j => j.id === job.id)).toBe(false)
    expect(svc.list_jobs(true).some(j => j.id === job.id)).toBe(true)
    svc.stop()
  })

  it('removeJob removes job', async () => {
    const svc = new CronService(storePath)
    await svc.start()
    const job = svc.add_job('r', { kind: 'every', every_ms: 60000 }, 'm')
    const removed = svc.removeJob(job.id)
    expect(removed).toBe(true)
    expect(svc.list_jobs(true).some(j => j.id === job.id)).toBe(false)
    expect(svc.removeJob('nonexistent')).toBe(false)
    svc.stop()
  })

  it('runJob executes job', async () => {
    const svc = new CronService(storePath)
    let ran = false
    svc.onJob = async () => {
      ran = true
      return undefined
    }
    await svc.start()
    const job = svc.add_job('run', { kind: 'every', every_ms: 60000 }, 'm')
    const ok = await svc.runJob(job.id, true)
    expect(ok).toBe(true)
    expect(ran).toBe(true)
    svc.stop()
  })

  it('add_job with delete_after_run', async () => {
    const svc = new CronService(storePath)
    svc.onJob = async () => undefined
    await svc.start()
    const job = svc.add_job('once', { kind: 'at', at_ms: Date.now() + 1000 }, 'm', { delete_after_run: true })
    expect(job.delete_after_run).toBe(true)
    svc.stop()
  })
})
