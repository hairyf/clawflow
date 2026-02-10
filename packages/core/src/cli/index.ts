import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import { defineCommand, runMain } from 'citty'
import path from 'pathe'
import packageJSON from '../../package.json' with { type: 'json' }
import { config } from '../config'
import { WORKSPACE_PATH } from '../constants'
import { start } from '../gateway'
import { session } from '../session'

let subcommand = false
/**
 * Nanobot PM CLI (citty). Commands: onboard, agent, status, cron.
 */
const main = defineCommand({
  meta: {
    name: 'agentic',
    version: packageJSON.version,
  },
  subCommands: {
    gateway: defineCommand({
      meta: {
        name: 'gateway',
      },
      run: async () => {
        subcommand = true
        await start()
      },
    }),
    cron: defineCommand({
      meta: {
        name: 'cron',
      },
      subCommands: {
        add: defineCommand({
          meta: {
            name: 'add',
            description: 'Add a cron job: agentic cron add <cron> <prompt>',
          },
          args: {
            cron: {
              type: 'positional',
              required: true,
              description: 'Cron expression, e.g. "0 9 * * *"',
            },
            prompt: {
              type: 'positional',
              required: true,
              description: 'Prompt to send when the job fires',
            },
          },
          run: async ({ args }) => {
            subcommand = true

            const cronDir = path.join(WORKSPACE_PATH, 'cron')
            const storePath = path.join(cronDir, 'jobs.json')

            await fs.mkdir(cronDir, { recursive: true })

            interface CronJobConfig {
              id: string
              expr: string
              prompt: string
              enabled?: boolean
            }

            interface CronStore {
              jobs: CronJobConfig[]
            }

            let store: CronStore = { jobs: [] }
            try {
              const raw = await fs.readFile(storePath, 'utf8')
              const parsed = JSON.parse(raw) as Partial<CronStore>
              store = {
                jobs: parsed.jobs ?? [],
              }
            }
            catch {
              // ignore, start with empty store
            }

            const id = randomUUID().slice(0, 8)

            store.jobs.push({
              id,
              expr: String(args.cron),
              prompt: String(args.prompt),
              enabled: true,
            })

            await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')

            console.log(`Cron job added: ${id}`)
          },
        }),
        remove: defineCommand({
          meta: {
            name: 'remove',
            description: 'Remove a cron job: agentic cron remove <cron-id>',
          },
          args: {
            id: {
              type: 'positional',
              required: true,
              description: 'Cron job id to remove',
            },
          },
          run: async ({ args }) => {
            subcommand = true

            const cronDir = path.join(WORKSPACE_PATH, 'cron')
            const storePath = path.join(cronDir, 'jobs.json')

            interface CronJobConfig {
              id: string
              expr: string
              prompt: string
              enabled?: boolean
            }

            interface CronStore {
              jobs: CronJobConfig[]
            }

            let store: CronStore
            try {
              const raw = await fs.readFile(storePath, 'utf8')
              const parsed = JSON.parse(raw) as Partial<CronStore>
              store = {
                jobs: parsed.jobs ?? [],
              }
            }
            catch {
              console.error('No cron jobs store found')
              return
            }

            const before = store.jobs.length
            store.jobs = store.jobs.filter(job => job.id !== String(args.id))

            if (store.jobs.length === before) {
              console.error(`Cron job not found: ${String(args.id)}`)
              return
            }

            await fs.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8')

            console.log(`Cron job removed: ${String(args.id)}`)
          },
        }),
      },
    }),
  },
  run: async () => {
    if (subcommand)
      return

    const id = await session.main.start()
    await config.agent.start(id)
  },
})

runMain(main)
