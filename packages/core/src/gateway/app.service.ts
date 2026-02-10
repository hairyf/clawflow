import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import type { SchedulerRegistry } from '@nestjs/schedule'
import fs from 'node:fs/promises'
import { Injectable, Logger } from '@nestjs/common'
import { Interval } from '@nestjs/schedule'
import { CronJob } from 'cron'
import path from 'pathe'
import { WORKSPACE_PATH } from '../constants'
import { session } from '../session'

interface CronJobConfig {
  id: string
  expr: string
  prompt: string
  enabled?: boolean
}

interface CronStore {
  jobs: CronJobConfig[]
}

const CRON_DIR = path.join(WORKSPACE_PATH, 'cron')
const CRON_STORE_PATH = path.join(CRON_DIR, 'jobs.json')

@Injectable()
export class AppService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppService.name)

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  async onModuleInit() {
    await this.syncJobs()
  }

  onModuleDestroy() {
    this.clearCronJobs()
  }

  private async loadJobs(): Promise<CronStore> {
    try {
      const raw = await fs.readFile(CRON_STORE_PATH, 'utf8')
      const parsed = JSON.parse(raw) as Partial<CronStore>
      return {
        jobs: parsed.jobs ?? [],
      }
    }
    catch (error: any) {
      if (error?.code !== 'ENOENT')
        this.logger.error('Failed to read cron store', error)
      return { jobs: [] }
    }
  }

  private getRegisteredCronIds(): Set<string> {
    const map = this.schedulerRegistry.getCronJobs()
    const ids = new Set<string>()

    for (const [name] of map.entries()) {
      if (name.startsWith('cron:'))
        ids.add(name.slice('cron:'.length))
    }

    return ids
  }

  @Interval(5_000)
  private async syncJobs() {
    const store = await this.loadJobs()
    const desiredIds = new Set(
      store.jobs
        .filter(job => job.enabled !== false)
        .map(job => job.id),
    )
    const existingIds = this.getRegisteredCronIds()

    // Remove jobs that no longer exist on disk
    for (const id of existingIds) {
      if (!desiredIds.has(id)) {
        const name = `cron:${id}`
        const job = this.schedulerRegistry.getCronJob(name)
        job.stop()
        this.schedulerRegistry.deleteCronJob(name)
        this.logger.log(`Removed cron job ${name}`)
      }
    }

    // Add new jobs found on disk
    for (const jobConfig of store.jobs) {
      if (jobConfig.enabled === false)
        continue
      if (existingIds.has(jobConfig.id))
        continue
      const name = `cron:${jobConfig.id}`
      const job = new CronJob(jobConfig.expr, async () => {
        try {
          await session.main.reply(jobConfig.prompt)
        }
        catch (error) {
          this.logger.error(`Cron job "${name}" execution failed`, error)
        }
      })

      this.schedulerRegistry.addCronJob(name, job)
      job.start()
      this.logger.log(`Registered cron job ${name}`)
    }
  }

  private clearCronJobs() {
    const map = this.schedulerRegistry.getCronJobs()

    for (const [name, job] of map.entries()) {
      if (!name.startsWith('cron:'))
        continue

      try {
        job.stop()
        this.schedulerRegistry.deleteCronJob(name)
      }
      catch {
        // ignore
      }
    }
  }
}
