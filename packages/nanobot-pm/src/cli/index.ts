/**
 * Nanobot PM CLI (citty). Commands: onboard, agent, status, cron.
 */

import type { CronSchedule } from '../cron/types'
import process from 'node:process'
import { confirm, isCancel } from '@clack/prompts'
import { defineCommand, runMain } from 'citty'
import { consola } from 'consola'
import { AgentLoop } from '../agent/loop'
import { SubagentManager } from '../agent/subagent'
import { start_bridge } from '../bridge'
import { MessageBus } from '../bus/queue'
import { get_api_key, get_workspace_path_from_config, load_config, save_config } from '../config/loader'
import { defaultConfig } from '../config/schema'
import { CronService } from '../cron/service'
import { start_gateway } from '../gateway'
import { create_ai_sdk_provider } from '../providers/ai-sdk'
import { get_config_path, get_cron_store_path, get_workspace_path } from '../utils/helpers'

const LOGO = '🐈'

const main = defineCommand({
  meta: {
    name: 'nanobot-pm',
    description: `${LOGO} Nanobot PM - Personal AI Assistant`,
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
        const configPath = get_config_path()
        const { existsSync, writeFileSync } = await import('node:fs')
        const { mkdirSync } = await import('node:fs')
        const workspace = get_workspace_path()
        if (existsSync(configPath)) {
          consola.warn(`Config already exists at ${configPath}`)
          const overwrite = await confirm({ message: 'Overwrite?' })
          if (isCancel(overwrite) || !overwrite) {
            process.exit(0)
          }
        }
        save_config(defaultConfig as any)
        consola.success(`Created config at ${configPath}`)
        consola.success(`Created workspace at ${workspace}`)
        const templates: Record<string, string> = {
          'AGENTS.md': `# Agent Instructions

You are a helpful AI assistant. Be concise, accurate, and friendly.

## Guidelines

- Always explain what you're doing before taking actions
- Ask for clarification when the request is ambiguous
- Use tools to help accomplish tasks
- Remember important information in your memory files
`,
          'SOUL.md': `# Soul

I am Nanobot PM, a lightweight AI assistant.

## Personality

- Helpful and friendly
- Concise and to the point
- Curious and eager to learn

## Values

- Accuracy over speed
- User privacy and safety
- Transparency in actions
`,
          'USER.md': `# User

Information about the user goes here.

## Preferences

- Communication style: (casual/formal)
- Timezone: (your timezone)
- Language: (your preferred language)
`,
        }
        for (const [name, content] of Object.entries(templates)) {
          const path = `${workspace}/${name}`
          if (!existsSync(path)) {
            writeFileSync(path, content, 'utf-8')
            consola.log(`  Created ${name}`)
          }
        }
        const memory_dir = `${workspace}/memory`
        mkdirSync(memory_dir, { recursive: true })
        const memory_file = `${memory_dir}/MEMORY.md`
        if (!existsSync(memory_file)) {
          writeFileSync(memory_file, `# Long-term Memory

This file stores important information that should persist across sessions.

## User Information

(Important facts about the user)

## Preferences

(User preferences learned over time)

## Important Notes

(Things to remember)
`, 'utf-8')
          consola.log('  Created memory/MEMORY.md')
        }
        consola.success(`\n${LOGO} Nanobot PM is ready!`)
        consola.log('\nNext steps:')
        consola.log('  1. Add your API key to ~/.nanobot-pm/config.json')
        consola.log('     Get one at: https://openrouter.ai/keys')
        consola.log('  2. Chat: nanobot-pm agent -m "Hello!"')
        consola.log('\nWant Telegram/WhatsApp? See: https://github.com/hairyf/nanobot-pm#-chat-apps')
      },
    }),
    agent: defineCommand({
      meta: { description: 'Chat with the agent' },
      args: {
        message: { type: 'string', alias: 'm', description: 'Message to send' },
        session: { type: 'string', alias: 's', default: 'cli:default', description: 'Session ID' },
      },
      async run({ args }) {
        const config = await load_config()
        const model = config.agents?.defaults?.model ?? 'anthropic/claude-sonnet-4'
        const apiKey = get_api_key(config)
        const is_bedrock = model.startsWith('bedrock/')
        if (!apiKey && !is_bedrock) {
          consola.error('No API key configured. Set providers.openrouter.apiKey in ~/.nanobot-pm/config.json')
          process.exit(1)
        }
        const workspace = get_workspace_path_from_config(config)
        const provider = create_ai_sdk_provider({ config, defaultModel: model })
        const bus = new MessageBus()
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
          rl.on('close', () => consola.log('\nGoodbye!'))
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
        const configPath = get_config_path()
        const config = await load_config()
        const workspace = get_workspace_path_from_config(config)
        const { existsSync } = await import('node:fs')
        consola.log(`${LOGO} Nanobot PM Status\n`)
        consola.log(`Config: ${configPath} ${existsSync(configPath) ? '✓' : '✗'}`)
        consola.log(`Workspace: ${workspace} ${existsSync(workspace) ? '✓' : '✗'}`)
        if (existsSync(configPath)) {
          consola.log(`Model: ${config.agents?.defaults?.model ?? 'default'}`)
          const p = config.providers ?? {}
          const has = (x?: { apiKey?: string }) => !!x?.apiKey
          consola.log(`OpenRouter API: ${has(p.openrouter) ? '✓' : 'not set'}`)
          consola.log(`Anthropic API: ${has(p.anthropic) ? '✓' : 'not set'}`)
          consola.log(`OpenAI API: ${has(p.openai) ? '✓' : 'not set'}`)
          consola.log(`Gemini API: ${has(p.gemini) ? '✓' : 'not set'}`)
          const vllm = p.vllm as { apiBase?: string } | undefined
          consola.log(`vLLM/Local: ${vllm?.apiBase ? `✓ ${vllm.apiBase}` : 'not set'}`)
        }
      },
    }),
    channels: defineCommand({
      meta: { description: 'Chat channels (Telegram, Discord, Feishu, WhatsApp)' },
      subCommands: {
        status: defineCommand({
          meta: { description: 'Show channel status (from config)' },
          async run() {
            const config = await load_config()
            const ch = config.channels ?? {}
            const wa = ch.whatsapp ?? {}
            const dc = ch.discord ?? {}
            const tg = ch.telegram ?? {}
            const tgConfig = tg.token ? `token: ${tg.token.slice(0, 10)}...` : 'not configured'
            consola.log('Channel Status')
            consola.log('Channel    Enabled  Configuration')
            consola.log(`WhatsApp   ${wa.enabled ? '✓' : '✗'}         ${wa.bridgeUrl ?? 'not set'}`)
            consola.log(`Discord    ${dc.enabled ? '✓' : '✗'}         ${dc.gatewayUrl ?? 'not set'}`)
            consola.log(`Telegram   ${tg.enabled ? '✓' : '✗'}         ${tgConfig}`)
            if (!ch.telegram?.enabled && !ch.discord?.enabled && !ch.feishu?.enabled && !ch.whatsapp?.enabled)
              consola.info('Enable in config: channels.telegram.enabled, etc.')
          },
        }),
        login: defineCommand({
          meta: { description: 'WhatsApp: link device via QR code (starts bridge)' },
          async run() {
            const config = await load_config()
            const bridgeConfig = config.bridge ?? { port: 3001, authDir: '~/.nanobot-pm/whatsapp-auth' }
            consola.info(`${LOGO} Starting WhatsApp bridge...`)
            consola.info('Scan the QR code to connect.\n')
            const server = await start_bridge(bridgeConfig)
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
            const config = await load_config()
            const bridgeConfig = config.bridge ?? { port: 3001, authDir: '~/.nanobot-pm/whatsapp-auth' }
            consola.info(`${LOGO} Starting WhatsApp bridge on port ${bridgeConfig.port ?? 3001}...`)
            const server = await start_bridge(bridgeConfig)
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
            verbose: { type: 'boolean', alias: 'v', default: false, description: 'Verbose output' },
          },
          async run({ args }) {
            if (args.verbose && typeof (consola as any).level !== 'undefined')
              (consola as any).level = 5
            const config = await load_config()
            const port = args.port ? Number(args.port) : config.gateway?.port ?? 18790
            consola.info(`${LOGO} Starting gateway on port ${port}...`)
            const controller = await start_gateway(config)
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
          args: {
            all: { type: 'boolean', alias: 'a', default: false, description: 'Include disabled jobs' },
          },
          async run({ args }) {
            const service = new CronService(get_cron_store_path())
            const jobs = service.list_jobs(args.all ?? false)
            if (jobs.length === 0) {
              consola.log('No scheduled jobs.')
              return
            }
            consola.log('Scheduled Jobs')
            consola.log('ID          Name    Schedule      Status    Next Run')
            for (const j of jobs) {
              const sched = j.schedule.kind === 'every'
                ? `every ${(j.schedule.every_ms ?? 0) / 1000}s`
                : j.schedule.kind === 'cron'
                  ? (j.schedule.expr ?? '')
                  : 'one-time'
              const d = j.state?.next_run_at_ms ? new Date(j.state.next_run_at_ms) : null
              const nextRun = d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : ''
              const status = j.enabled ? 'enabled' : 'disabled'
              consola.log(`${j.id.padEnd(11)} ${j.name.padEnd(6)} ${sched.padEnd(13)} ${status.padEnd(9)} ${nextRun}`)
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
            delete_after_run: { type: 'boolean', default: false, description: 'Remove job after it runs (for --at jobs)' },
          },
          async run({ args }) {
            let schedule: CronSchedule
            if (args.every) {
              schedule = { kind: 'every', every_ms: Number(args.every) * 1000 }
            }
            else if (args.cron) {
              schedule = { kind: 'cron', expr: args.cron }
            }
            else if (args.at) {
              const at_ms = new Date(args.at).getTime()
              if (Number.isNaN(at_ms)) {
                consola.error('Invalid --at format. Use ISO format, e.g. 2025-02-07T15:00:00')
                process.exit(1)
              }
              schedule = { kind: 'at', at_ms }
            }
            else {
              consola.error('Specify --every, --cron, or --at')
              process.exit(1)
            }
            const service = new CronService(get_cron_store_path())
            const job = service.add_job(args.name as string, schedule, args.message as string, {
              deliver: args.deliver ?? false,
              channel: args.channel as string | undefined,
              to: args.to as string | undefined,
              delete_after_run: args.delete_after_run ?? false,
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
              consola.error('Usage: nanobot-pm cron remove <job_id>')
              process.exit(1)
            }
            const service = new CronService(get_cron_store_path())
            if (service.removeJob(id))
              consola.success(`Removed job ${id}`)
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
              consola.error('Usage: nanobot-pm cron enable <job_id> [--disable]')
              process.exit(1)
            }
            const service = new CronService(get_cron_store_path())
            const job = service.enable_job(id, !args.disable)
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
              consola.error('Usage: nanobot-pm cron run <job_id> [--force]')
              process.exit(1)
            }
            const config = await load_config()
            const apiKey = get_api_key(config)
            if (!apiKey) {
              consola.error('No API key configured. Run nanobot-pm onboard and set API key in config.')
              process.exit(1)
            }
            const workspace = get_workspace_path_from_config(config)
            const model = config.agents?.defaults?.model ?? 'anthropic/claude-sonnet-4'
            const provider = create_ai_sdk_provider({ config, defaultModel: model })
            const bus = new MessageBus()
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
              subagentManager: subagent,
            })
            const cronService = new CronService(get_cron_store_path())
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
                  chat_id: job.payload.to,
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
