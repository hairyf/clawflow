/**
 * Gateway: orchestrates channels + heartbeat + cron + agent.
 * @see sources/nanobot/nanobot/cli/commands.py gateway()
 */

import type { ClawflowConfig } from '../config/schema'
import type { CronJob } from '../cron/types'
import { consola } from 'consola'
import { AgentLoop } from '../agent/loop'
import { SubagentManager } from '../agent/subagent'
import { MessageBus } from '../bus/queue'
import { ChannelManager } from '../channels/manager'
import { get_api_key, get_workspace_path_from_config } from '../config/loader'
import { CronService } from '../cron/service'
import { HeartbeatService } from '../heartbeat'
import { create_ai_sdk_provider } from '../providers/ai-sdk'
import { get_cron_store_path } from '../utils/helpers'

const LOGO = '🐈'

export interface GatewayController {
  stop: () => Promise<void>
}

export async function start_gateway(config: ClawflowConfig): Promise<GatewayController> {
  const apiKey = get_api_key(config)
  if (!apiKey) {
    throw new Error('No API key configured. Set providers.openrouter.apiKey in ~/.clawflow/config.json')
  }

  const workspace = get_workspace_path_from_config(config)
  const model = config.agents?.defaults?.model ?? 'anthropic/claude-sonnet-4'
  const heartbeatConfig = config.heartbeat ?? { enabled: true, intervalS: 30 * 60 }

  const bus = new MessageBus()
  const provider = create_ai_sdk_provider({ config, defaultModel: model })

  const cronService = new CronService(get_cron_store_path())
  const subagent = new SubagentManager({
    provider,
    workspace,
    bus,
    model,
    braveApiKey: config.tools?.web?.search?.apiKey,
    exec_timeout: config.tools?.exec?.timeout,
    restrictToWorkspace: config.tools?.restrictToWorkspace,
  })
  const agent = new AgentLoop({
    bus,
    provider,
    workspace,
    model,
    braveApiKey: config.tools?.web?.search?.apiKey,
    exec_timeout: config.tools?.exec?.timeout,
    restrictToWorkspace: config.tools?.restrictToWorkspace,
    cronService,
    subagentManager: subagent,
  })

  cronService.onJob = async (job: CronJob) => {
    const response = await agent.processDirect(
      job.payload.message,
      `cron:${job.id}`,
      job.payload.channel ?? 'cli',
      job.payload.to ?? 'direct',
    )
    if (job.payload.deliver && job.payload.channel && job.payload.to) {
      await bus.publishOutbound({
        channel: job.payload.channel,
        chat_id: job.payload.to,
        content: response ?? '',
      })
    }
    return response
  }

  const heartbeat = new HeartbeatService({
    workspace,
    onHeartbeat: async prompt => agent.processDirect(prompt, 'heartbeat'),
    intervalS: heartbeatConfig.intervalS ?? 30 * 60,
    enabled: heartbeatConfig.enabled ?? true,
  })

  const channelManager = new ChannelManager(config, bus)

  const enabledChannels = channelManager.enabledChannels
  if (enabledChannels.length > 0)
    consola.info(`${LOGO} Channels: ${enabledChannels.join(', ')}`)
  else
    consola.warn('No channels enabled in config')

  const cronJobs = cronService.list_jobs(true)
  if (cronJobs.length > 0)
    consola.info(`${LOGO} Cron: ${cronJobs.length} job(s)`)
  consola.info(`${LOGO} Heartbeat: every ${heartbeatConfig.intervalS ?? 30 * 60}s`)

  cronService.start()
  heartbeat.start()

  await agent.run()
  await channelManager.startAll()

  return {
    async stop() {
      consola.info('Stopping gateway...')
      heartbeat.stop()
      cronService.stop()
      agent.stop()
      await channelManager.stopAll()
      consola.info(`${LOGO} Gateway stopped`)
    },
  }
}
