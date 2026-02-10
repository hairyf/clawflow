declare module 'cron' {
  export class CronJob {
    constructor(cronTime: string | Date, onTick: () => void)
    start(): void
    stop(): void
  }
}
