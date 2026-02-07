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
    const at = schedule.atMs ?? 0
    return at > now ? at : undefined
  }
  if (schedule.kind === 'every') {
    const every = schedule.everyMs ?? 0
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
            atMs: j.schedule?.atMs,
            everyMs: j.schedule?.everyMs,
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
            nextRunAtMs: j.state?.nextRunAtMs,
            lastRunAtMs: j.state?.lastRunAtMs,
            lastStatus: j.state?.lastStatus,
            lastError: j.state?.lastError,
          },
          createdAtMs: j.createdAtMs ?? 0,
          updatedAtMs: j.updatedAtMs ?? 0,
          deleteAfterRun: j.deleteAfterRun,
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
          atMs: j.schedule.atMs,
          everyMs: j.schedule.everyMs,
          expr: j.schedule.expr,
          tz: j.schedule.tz,
        },
        payload: j.payload,
        state: j.state,
        createdAtMs: j.createdAtMs,
        updatedAtMs: j.updatedAtMs,
        deleteAfterRun: j.deleteAfterRun,
      })),
    }
    writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  private getNextWakeMs(): number | undefined {
    const store = this.loadStore()
    const times = store.jobs
      .filter(j => j.enabled && j.state.nextRunAtMs)
      .map(j => j.state.nextRunAtMs!)
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
      j => j.enabled && j.state.nextRunAtMs && now >= j.state.nextRunAtMs,
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
    job.updatedAtMs = nowMs()
    if (job.schedule.kind === 'at') {
      if (job.deleteAfterRun) {
        this.store!.jobs = this.store!.jobs.filter(j => j.id !== job.id)
      }
      else {
        job.enabled = false
        job.state.nextRunAtMs = undefined
      }
    }
    else {
      job.state.nextRunAtMs = computeNextRun(job.schedule, nowMs())
    }
  }

  async start(): Promise<void> {
    this.running = true
    const store = this.loadStore()
    const now = nowMs()
    for (const job of store.jobs) {
      if (job.enabled && !job.state.nextRunAtMs)
        job.state.nextRunAtMs = computeNextRun(job.schedule, now)
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

  listJobs(includeDisabled = false): CronJob[] {
    const store = this.loadStore()
    const list = includeDisabled ? store.jobs : store.jobs.filter(j => j.enabled)
    return list.sort((a, b) => (a.state.nextRunAtMs ?? Infinity) - (b.state.nextRunAtMs ?? Infinity))
  }

  addJob(
    name: string,
    schedule: CronSchedule,
    message: string,
    opts: { deliver?: boolean, channel?: string, to?: string } = {},
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
      state: { nextRunAtMs: computeNextRun(schedule, now) },
      createdAtMs: now,
      updatedAtMs: now,
    }
    store.jobs.push(job)
    this.saveStore()
    this.armTimer()
    consola.info(`Cron: added job '${name}' (${job.id})`)
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
