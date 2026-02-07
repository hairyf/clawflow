/**
 * Cron job types.
 * @see sources/nanobot/nanobot/cron/types.py
 */

export type ScheduleKind = 'at' | 'every' | 'cron'

export interface CronSchedule {
  kind: ScheduleKind
  atMs?: number
  everyMs?: number
  expr?: string
  tz?: string
}

export interface CronPayload {
  kind: 'system_event' | 'agent_turn'
  message: string
  deliver: boolean
  channel?: string
  to?: string
}

export interface CronJobState {
  nextRunAtMs?: number
  lastRunAtMs?: number
  lastStatus?: 'ok' | 'error' | 'skipped'
  lastError?: string
}

export interface CronJob {
  id: string
  name: string
  enabled: boolean
  schedule: CronSchedule
  payload: CronPayload
  state: CronJobState
  createdAtMs: number
  updatedAtMs: number
  deleteAfterRun?: boolean
}

export interface CronStore {
  version: number
  jobs: CronJob[]
}
