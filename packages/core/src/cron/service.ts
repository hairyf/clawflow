/**
 * Cron service: load/store jobs, timer loop, run jobs.
 * @see sources/nanobot/nanobot/cron/service.py
 */

import type { CronJob, CronSchedule, CronStore } from './types'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { consola } from 'consola'
import cronParser from 'cron-parser'
import { dirname } from 'pathe'

function nowMs(): number {
  return Date.now()
}

function computeNextRun(schedule: CronSchedule, now: number): number | undefined {
  if (schedule.kind === 'at') {
    const at = schedule.at_ms ?? 0
    return at > now ? at : undefined
  }
  if (schedule.kind === 'every') {
    const every = schedule.every_ms ?? 0
    return every > 0 ? now + every : undefined
  }
  if (schedule.kind === 'cron' && schedule.expr) {
    try {
      const interval = cronParser.parseExpression(schedule.expr)
      const next = interval.next().getTime()
      return next
    }
    catch {
      return undefined
    }
  }
  return undefined
}

export type OnJobCallback = (job: CronJob) => Promise<string | undefined>

export class CronService {
  private storePath: string
  private store: CronStore | null = null
  private timerId: ReturnType<typeof setTimeout> | null = null
  private running = false

  onJob: OnJobCallback | null = null

  constructor(storePath: string) {
    this.storePath = storePath
  }

  private loadStore(): CronStore {
    if (this.store)
      return this.store
    if (existsSync(this.storePath)) {
      try {
        const data = JSON.parse(readFileSync(this.storePath, 'utf-8')) as { jobs?: unknown[] }
        const jobs: CronJob[] = (data.jobs ?? []).map((j: any) => ({
          id: j.id,
          name: j.name,
          enabled: j.enabled !== false,
          schedule: {
            kind: j.schedule?.kind ?? 'every',
            at_ms: j.schedule?.at_ms,
            every_ms: j.schedule?.every_ms,
            expr: j.schedule?.expr,
            tz: j.schedule?.tz,
          },
          payload: {
            kind: j.payload?.kind ?? 'agent_turn',
            message: j.payload?.message ?? '',
            deliver: j.payload?.deliver ?? false,
            channel: j.payload?.channel,
            to: j.payload?.to,
          },
          state: {
            next_run_at_ms: j.state?.next_run_at_ms,
            lastRunAtMs: j.state?.lastRunAtMs,
            lastStatus: j.state?.lastStatus,
            lastError: j.state?.lastError,
          },
          created_at_ms: j.created_at_ms ?? 0,
          updated_at_ms: j.updated_at_ms ?? 0,
          delete_after_run: j.delete_after_run,
        }))
        this.store = { version: 1, jobs }
        return this.store
      }
      catch (e) {
        consola.warn('Failed to load cron store:', e)
      }
    }
    this.store = { version: 1, jobs: [] }
    return this.store
  }

  private saveStore(): void {
    if (!this.store)
      return
    mkdirSync(dirname(this.storePath), { recursive: true })
    const data = {
      version: this.store.version,
      jobs: this.store.jobs.map(j => ({
        id: j.id,
        name: j.name,
        enabled: j.enabled,
        schedule: {
          kind: j.schedule.kind,
          at_ms: j.schedule.at_ms,
          every_ms: j.schedule.every_ms,
          expr: j.schedule.expr,
          tz: j.schedule.tz,
        },
        payload: j.payload,
        state: j.state,
        created_at_ms: j.created_at_ms,
        updated_at_ms: j.updated_at_ms,
        delete_after_run: j.delete_after_run,
      })),
    }
    writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  private getNextWakeMs(): number | undefined {
    const store = this.loadStore()
    const times = store.jobs
      .filter(j => j.enabled && j.state.next_run_at_ms)
      .map(j => j.state.next_run_at_ms!)
    return times.length ? Math.min(...times) : undefined
  }

  private armTimer(): void {
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
    const next = this.getNextWakeMs()
    if (!next || !this.running)
      return
    const delay = Math.max(0, next - nowMs())
    this.timerId = setTimeout(() => {
      this.timerId = null
      if (this.running)
        this.onTimer()
    }, delay)
  }

  private async onTimer(): Promise<void> {
    const store = this.loadStore()
    const now = nowMs()
    const due = store.jobs.filter(
      j => j.enabled && j.state.next_run_at_ms && now >= j.state.next_run_at_ms,
    )
    for (const job of due)
      await this.executeJob(job)
    this.saveStore()
    this.armTimer()
  }

  private async executeJob(job: CronJob): Promise<void> {
    const start = nowMs()
    consola.info(`Cron: executing job '${job.name}' (${job.id})`)
    try {
      if (this.onJob)
        await this.onJob(job)
      job.state.lastStatus = 'ok'
      job.state.lastError = undefined
    }
    catch (e) {
      job.state.lastStatus = 'error'
      job.state.lastError = String(e)
      consola.error(`Cron: job '${job.name}' failed:`, e)
    }
    job.state.lastRunAtMs = start
    job.updated_at_ms = nowMs()
    if (job.schedule.kind === 'at') {
      if (job.delete_after_run) {
        this.store!.jobs = this.store!.jobs.filter(j => j.id !== job.id)
      }
      else {
        job.enabled = false
        job.state.next_run_at_ms = undefined
      }
    }
    else {
      job.state.next_run_at_ms = computeNextRun(job.schedule, nowMs())
    }
  }

  async start(): Promise<void> {
    this.running = true
    const store = this.loadStore()
    const now = nowMs()
    for (const job of store.jobs) {
      if (job.enabled && !job.state.next_run_at_ms)
        job.state.next_run_at_ms = computeNextRun(job.schedule, now)
    }
    this.saveStore()
    this.armTimer()
    consola.info(`Cron service started with ${store.jobs.length} jobs`)
  }

  stop(): void {
    this.running = false
    if (this.timerId) {
      clearTimeout(this.timerId)
      this.timerId = null
    }
  }

  list_jobs(includeDisabled = false): CronJob[] {
    const store = this.loadStore()
    const list = includeDisabled ? store.jobs : store.jobs.filter(j => j.enabled)
    return list.sort((a, b) => (a.state.next_run_at_ms ?? Infinity) - (b.state.next_run_at_ms ?? Infinity))
  }

  add_job(
    name: string,
    schedule: CronSchedule,
    message: string,
    opts: { deliver?: boolean, channel?: string, to?: string, delete_after_run?: boolean } = {},
  ): CronJob {
    const store = this.loadStore()
    const now = nowMs()
    const job: CronJob = {
      id: Math.random().toString(36).slice(2, 10),
      name,
      enabled: true,
      schedule,
      payload: {
        kind: 'agent_turn',
        message,
        deliver: opts.deliver ?? false,
        channel: opts.channel,
        to: opts.to,
      },
      state: { next_run_at_ms: computeNextRun(schedule, now) },
      created_at_ms: now,
      updated_at_ms: now,
      delete_after_run: opts.delete_after_run,
    }
    store.jobs.push(job)
    this.saveStore()
    this.armTimer()
    consola.info(`Cron: added job '${name}' (${job.id})`)
    return job
  }

  enable_job(jobId: string, enabled: boolean): CronJob | null {
    const store = this.loadStore()
    const job = store.jobs.find(j => j.id === jobId)
    if (!job)
      return null
    if (job.enabled === enabled)
      return job
    job.enabled = enabled
    job.updated_at_ms = nowMs()
    if (enabled && !job.state.next_run_at_ms)
      job.state.next_run_at_ms = computeNextRun(job.schedule, nowMs())
    this.saveStore()
    this.armTimer()
    return job
  }

  removeJob(jobId: string): boolean {
    const store = this.loadStore()
    const before = store.jobs.length
    store.jobs = store.jobs.filter(j => j.id !== jobId)
    const removed = store.jobs.length < before
    if (removed) {
      this.saveStore()
      this.armTimer()
    }
    return removed
  }

  async runJob(jobId: string, force = false): Promise<boolean> {
    const store = this.loadStore()
    const job = store.jobs.find(j => j.id === jobId)
    if (!job || (!force && !job.enabled))
      return false
    await this.executeJob(job)
    this.saveStore()
    this.armTimer()
    return true
  }
}
