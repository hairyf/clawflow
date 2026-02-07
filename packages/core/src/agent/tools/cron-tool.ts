/**
 * Cron tool: add/list/remove scheduled jobs.
 * @see sources/nanobot/nanobot/agent/tools/cron.py
 */

import type { Tool } from './base.js'
import type { CronService } from '../../cron/service.js'
import type { CronSchedule } from '../../cron/types.js'

export function cronTool(service: CronService): Tool & { setContext(channel: string, chatId: string): void } {
  let channel = ''
  let chatId = ''
  return {
    name: 'cron',
    description: 'Schedule reminders and recurring tasks. Actions: add, list, remove.',
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['add', 'list', 'remove'], description: 'Action to perform' },
        message: { type: 'string', description: 'Reminder message (for add)' },
        every_seconds: { type: 'number', description: 'Interval in seconds (for add)' },
        cron_expr: { type: 'string', description: "Cron expression e.g. '0 9 * * *' (for add)" },
        job_id: { type: 'string', description: 'Job ID (for remove)' },
      },
      required: ['action'],
    },
    setContext(ch: string, id: string) {
      channel = ch
      chatId = id
    },
    async execute({ action, message, every_seconds, cron_expr, job_id }: Record<string, unknown>) {
      if (action === 'add') {
        if (!message)
          return 'Error: message is required for add'
        if (!channel || !chatId)
          return 'Error: no session context (channel/chat_id)'
        let schedule: CronSchedule
        if (every_seconds) {
          schedule = { kind: 'every', everyMs: Number(every_seconds) * 1000 }
        }
        else if (cron_expr) {
          schedule = { kind: 'cron', expr: String(cron_expr) }
        }
        else {
          return 'Error: either every_seconds or cron_expr is required'
        }
        const job = service.addJob(String(message).slice(0, 30), schedule, String(message), {
          deliver: true,
          channel,
          to: chatId,
        })
        return `Created job '${job.name}' (id: ${job.id})`
      }
      if (action === 'list') {
        const jobs = service.listJobs()
        if (jobs.length === 0)
          return 'No scheduled jobs.'
        return 'Scheduled jobs:\n' + jobs.map(j => `- ${j.name} (id: ${j.id}, ${j.schedule.kind})`).join('\n')
      }
      if (action === 'remove') {
        if (!job_id)
          return 'Error: job_id is required for remove'
        return service.removeJob(String(job_id)) ? `Removed job ${job_id}` : `Job ${job_id} not found`
      }
      return `Unknown action: ${action}`
    },
  }
}
