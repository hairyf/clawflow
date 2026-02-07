/**
 * ClawFlow CLI (citty). Commands: onboard, agent, status, cron.
 */

import type { CronSchedule } from '../cron/types'
import process from 'node:process'
import { intro, outro } from '@clack/prompts'
import { defineCommand, runMain } from 'citty'
import { consola } from 'consola'
import { AgentLoop } from '../agent/loop'
import { SubagentManager } from '../agent/subagent'
import { startBridge } from '../bridge'
import { MessageBus } from '../bus/queue'
import { getApiKey, getWorkspacePathFromConfig, loadConfig, saveConfig } from '../config/loader'
import { defaultConfig } from '../config/schema'
import { CronService } from '../cron/service'
import { startGateway } from '../gateway'
import { createAISDKProvider } from '../providers/ai-sdk'
import { getConfigPath, getCronStorePath, getWorkspacePath } from '../utils/helpers'

const LOGO = '🐈'

const main = defineCommand({
  meta: {
    name: 'clawflow',
    description: `${LOGO} ClawFlow - Personal AI Assistant`,
    version: '0.0.0',
  },
  args: {
    version: {
      type: 'boolean',
      alias: 'v',
      description: 'Show version',
    },
  },
  subCommands: {
    onboard: defineCommand({
      meta: { description: 'Initialize config and workspace' },
      async run() {
        const configPath = getConfigPath()
        const { existsSync, writeFileSync } = await import('node:fs')
        const { mkdirSync } = await import('node:fs')
        const workspace = getWorkspacePath()
        if (existsSync(configPath)) {
          consola.warn(`Config already exists at ${configPath}`)
        }
        else {
          saveConfig(defaultConfig as any)
          consola.success(`Created config at ${configPath}`)
        }
        consola.success(`Workspace at ${workspace}`)
        const templates: Record<string, string> = {
          'AGENTS.md': '# Agent Instructions\n\nYou are a helpful AI assistant. Be concise and accurate.',
          'SOUL.md': '# Soul\n\nI am ClawFlow, a lightweight AI assistant.',
          'USER.md': '# User\n\nUser preferences go here.',
        }
        for (const [name, content] of Object.entries(templates)) {
          const path = `${workspace}/${name}`
          if (!existsSync(path)) {
            writeFileSync(path, content, 'utf-8')
            consola.log(`  Created ${name}`)
          }
        }
        const memoryDir = `${workspace}/memory`
        mkdirSync(memoryDir, { recursive: true })
        const memoryFile = `${memoryDir}/MEMORY.md`
        if (!existsSync(memoryFile)) {
          writeFileSync(memoryFile, '# Long-term Memory\n\n(Important facts and preferences)\n', 'utf-8')
          consola.log('  Created memory/MEMORY.md')
        }
        consola.success(`${LOGO} ClawFlow is ready!`)
        consola.info('Next: add API key to ~/.clawflow/config.json, then run: clawflow agent -m "Hello!"')
      },
    }),
    agent: defineCommand({
      meta: { description: 'Chat with the agent' },
      args: {
        message: { type: 'string', alias: 'm', description: 'Message to send' },
        session: { type: 'string', alias: 's', default: 'cli:default', description: 'Session ID' },
      },
      async run({ args }) {
        const config = await loadConfig()
        const apiKey = getApiKey(config)
        if (!apiKey) {
          consola.error('No API key configured. Set providers.openrouter.apiKey in ~/.clawflow/config.json')
          process.exit(1)
        }
        const workspace = getWorkspacePathFromConfig(config)
        const model = config.agents?.defaults?.model ?? 'anthropic/claude-sonnet-4'
        const provider = createAISDKProvider({ config, defaultModel: model })
        const bus = new MessageBus()
        const subagent = new SubagentManager({
          provider,
          workspace,
          bus,
          model,
          braveApiKey: config.tools?.web?.search?.apiKey,
          execTimeout: config.tools?.exec?.timeout,
          restrictToWorkspace: config.tools?.restrictToWorkspace,
        })
        const agent = new AgentLoop({
          bus,
          provider,
          workspace,
          model,
          braveApiKey: config.tools?.web?.search?.apiKey,
          execTimeout: config.tools?.exec?.timeout,
          restrictToWorkspace: config.tools?.restrictToWorkspace,
          subagentManager: subagent,
        })
        const message = args.message as string | undefined
        if (message) {
          const response = await agent.processDirect(message, args.session as string)
          consola.log(`\n${LOGO} ${response}`)
        }
        else {
          consola.log(`${LOGO} Interactive mode (Ctrl+C to exit)\n`)
          const readline = await import('node:readline/promises')
          const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
          for (;;) {
            const line = await rl.question('You: ')
            if (!line?.trim())
              continue
            const response = await agent.processDirect(line.trim(), args.session as string)
            consola.log(`\n${LOGO} ${response}\n`)
          }
        }
      },
    }),
    status: defineCommand({
      meta: { description: 'Show status' },
      async run() {
        const configPath = getConfigPath()
        const config = await loadConfig()
        const workspace = getWorkspacePathFromConfig(config)
        const { existsSync } = await import('node:fs')
        intro(`${LOGO} ClawFlow Status`)
        consola.log(`Config: ${configPath} ${existsSync(configPath) ? '✓' : '✗'}`)
        consola.log(`Workspace: ${workspace} ${existsSync(workspace) ? '✓' : '✗'}`)
        consola.log(`Model: ${config.agents?.defaults?.model ?? 'default'}`)
        const key = getApiKey(config)
        consola.log(`API key: ${key ? '✓' : 'not set'}`)
        outro('Done')
      },
    }),
    channels: defineCommand({
      meta: { description: 'Chat channels (Telegram, Discord, Feishu, WhatsApp)' },
      subCommands: {
        status: defineCommand({
          meta: { description: 'Show channel status (from config)' },
          async run() {
            intro(`${LOGO} Channels`)
            const config = await loadConfig()
            const ch = config.channels ?? {}
            const rows: [string, boolean][] = [
              ['telegram', ch.telegram?.enabled ?? false],
              ['discord', ch.discord?.enabled ?? false],
              ['feishu', ch.feishu?.enabled ?? false],
              ['whatsapp', ch.whatsapp?.enabled ?? false],
            ]
            consola.log('Channel    Enabled (in config)')
            for (const [name, on] of rows) {
              consola.log(`${name.padEnd(10)} ${on ? '✓' : '—'}`)
            }
            if (!rows.some(([, on]) => on))
              consola.info('Enable in config: channels.telegram.enabled, etc.')
            outro('Done')
          },
        }),
        login: defineCommand({
          meta: { description: 'WhatsApp: link device via QR code (starts bridge)' },
          async run() {
            const config = await loadConfig()
            const bridgeConfig = config.bridge ?? { port: 3001, authDir: '~/.clawflow/whatsapp-auth' }
            consola.info(`${LOGO} Starting WhatsApp bridge...`)
            consola.info('Scan the QR code to connect.\n')
            const server = await startBridge(bridgeConfig)
            process.on('SIGINT', async () => {
              consola.info('Shutting down bridge...')
              await server.stop()
              process.exit(0)
            })
            process.on('SIGTERM', async () => {
              await server.stop()
              process.exit(0)
            })
          },
        }),
      },
    }),
    bridge: defineCommand({
      meta: { description: 'WhatsApp WebSocket bridge (Baileys + crossws)' },
      subCommands: {
        start: defineCommand({
          meta: { description: 'Start bridge server for WhatsApp channel' },
          async run() {
            const config = await loadConfig()
            const bridgeConfig = config.bridge ?? { port: 3001, authDir: '~/.clawflow/whatsapp-auth' }
            consola.info(`${LOGO} Starting WhatsApp bridge on port ${bridgeConfig.port ?? 3001}...`)
            const server = await startBridge(bridgeConfig)
            process.on('SIGINT', async () => {
              consola.info('Shutting down bridge...')
              await server.stop()
              process.exit(0)
            })
            process.on('SIGTERM', async () => {
              await server.stop()
              process.exit(0)
            })
          },
        }),
      },
    }),
    gateway: defineCommand({
      meta: { description: 'Start gateway (channels + heartbeat + cron + agent)' },
      subCommands: {
        start: defineCommand({
          meta: { description: 'Start the gateway' },
          args: {
            port: { type: 'string', alias: 'p', description: 'Gateway port (for future HTTP API)' },
          },
          async run({ args }) {
            const config = await loadConfig()
            const port = args.port ? Number(args.port) : config.gateway?.port ?? 18790
            consola.info(`${LOGO} Starting gateway on port ${port}...`)
            const controller = await startGateway(config)
            const shutdown = async (): Promise<void> => {
              await controller.stop()
              process.exit(0)
            }
            process.on('SIGINT', shutdown)
            process.on('SIGTERM', shutdown)
            await new Promise<never>(() => {})
          },
        }),
      },
    }),
    cron: defineCommand({
      meta: { description: 'Scheduled tasks' },
      subCommands: {
        list: defineCommand({
          meta: { description: 'List jobs' },
          async run() {
            const service = new CronService(getCronStorePath())
            const jobs = service.listJobs(true)
            if (jobs.length === 0) {
              consola.log('No scheduled jobs.')
              return
            }
            for (const j of jobs) {
              const sched = j.schedule.kind === 'every'
                ? `every ${(j.schedule.everyMs ?? 0) / 1000}s`
                : j.schedule.kind === 'cron'
                  ? (j.schedule.expr ?? '')
                  : 'at'
              consola.log(`- ${j.name} (id: ${j.id}) ${sched} ${j.enabled ? 'enabled' : 'disabled'}`)
            }
          },
        }),
        add: defineCommand({
          meta: { description: 'Add job' },
          args: {
            name: { type: 'string', alias: 'n', required: true },
            message: { type: 'string', alias: 'm', required: true },
            every: { type: 'string', alias: 'e', description: 'Every N seconds' },
            cron: { type: 'string', alias: 'c', description: 'Cron expression' },
            at: { type: 'string', alias: 'a', description: 'Run once at time (ISO format, e.g. 2025-02-07T15:00:00)' },
            deliver: { type: 'boolean', alias: 'd', default: false, description: 'Deliver response to channel' },
            to: { type: 'string', alias: 't', description: 'Recipient for delivery (chat_id)' },
            channel: { type: 'string', alias: 'ch', description: 'Channel for delivery (e.g. telegram, whatsapp)' },
            deleteAfterRun: { type: 'boolean', default: false, description: 'Remove job after it runs (for --at jobs)' },
          },
          async run({ args }) {
            let schedule: CronSchedule
            if (args.every) {
              schedule = { kind: 'every', everyMs: Number(args.every) * 1000 }
            }
            else if (args.cron) {
              schedule = { kind: 'cron', expr: args.cron }
            }
            else if (args.at) {
              const atMs = new Date(args.at).getTime()
              if (Number.isNaN(atMs)) {
                consola.error('Invalid --at format. Use ISO format, e.g. 2025-02-07T15:00:00')
                process.exit(1)
              }
              schedule = { kind: 'at', atMs }
            }
            else {
              consola.error('Specify --every, --cron, or --at')
              process.exit(1)
            }
            const service = new CronService(getCronStorePath())
            const job = service.addJob(args.name as string, schedule, args.message as string, {
              deliver: args.deliver ?? false,
              channel: args.channel as string | undefined,
              to: args.to as string | undefined,
              deleteAfterRun: args.deleteAfterRun ?? false,
            })
            consola.success(`Added job '${job.name}' (${job.id})`)
          },
        }),
        remove: defineCommand({
          meta: { description: 'Remove job' },
          args: { jobId: { type: 'positional', description: 'Job ID' } },
          async run({ args }) {
            const id = (args._?.[0] ?? args.jobId) as string
            if (!id) {
              consola.error('Usage: clawflow cron remove <job_id>')
              process.exit(1)
            }
            const service = new CronService(getCronStorePath())
            if (service.removeJob(id))
              consola.success(`Removed ${id}`)
            else
              consola.error(`Job ${id} not found`)
          },
        }),
        enable: defineCommand({
          meta: { description: 'Enable or disable a job' },
          args: {
            jobId: { type: 'positional', description: 'Job ID' },
            disable: { type: 'boolean', default: false, description: 'Disable instead of enable' },
          },
          async run({ args }) {
            const id = (args._?.[0] ?? args.jobId) as string
            if (!id) {
              consola.error('Usage: clawflow cron enable <job_id> [--disable]')
              process.exit(1)
            }
            const service = new CronService(getCronStorePath())
            const job = service.enableJob(id, !args.disable)
            if (job)
              consola.success(`Job '${job.name}' ${args.disable ? 'disabled' : 'enabled'}`)
            else
              consola.error(`Job ${id} not found`)
          },
        }),
        run: defineCommand({
          meta: { description: 'Manually run a job' },
          args: {
            jobId: { type: 'positional', description: 'Job ID' },
            force: { type: 'boolean', alias: 'f', default: false, description: 'Run even if disabled' },
          },
          async run({ args }) {
            const id = (args._?.[0] ?? args.jobId) as string
            if (!id) {
              consola.error('Usage: clawflow cron run <job_id> [--force]')
              process.exit(1)
            }
            const config = await loadConfig()
            const apiKey = getApiKey(config)
            if (!apiKey) {
              consola.error('No API key configured. Run clawflow onboard and set API key in config.')
              process.exit(1)
            }
            const workspace = getWorkspacePathFromConfig(config)
            const model = config.agents?.defaults?.model ?? 'anthropic/claude-sonnet-4'
            const provider = createAISDKProvider({ config, defaultModel: model })
            const bus = new MessageBus()
            const subagent = new SubagentManager({
              provider,
              workspace,
              bus,
              model,
              braveApiKey: config.tools?.web?.search?.apiKey,
              execTimeout: config.tools?.exec?.timeout,
              restrictToWorkspace: config.tools?.restrictToWorkspace,
            })
            const agent = new AgentLoop({
              bus,
              provider,
              workspace,
              model,
              braveApiKey: config.tools?.web?.search?.apiKey,
              execTimeout: config.tools?.exec?.timeout,
              restrictToWorkspace: config.tools?.restrictToWorkspace,
              subagentManager: subagent,
            })
            const cronService = new CronService(getCronStorePath())
            cronService.onJob = async (job) => {
              const response = await agent.processDirect(
                job.payload.message,
                `cron:${job.id}`,
                job.payload.channel ?? 'cli',
                job.payload.to ?? 'direct',
              )
              if (job.payload.deliver && job.payload.channel && job.payload.to) {
                await bus.publishOutbound({
                  channel: job.payload.channel,
                  chatId: job.payload.to,
                  content: response ?? '',
                })
              }
              return response
            }
            const ok = await cronService.runJob(id, args.force)
            if (ok)
              consola.success('Job executed')
            else
              consola.error(`Failed to run job ${id}`)
          },
        }),
      },
    }),
  },
})

export function run(): void {
  runMain(main, { rawArgs: process.argv.slice(2) })
}
run()
