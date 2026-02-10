import type { AgenticConfig } from '../config'
import { loadConfig } from 'c12'
import { defineCommand, runMain } from 'citty'
import packageJSON from '../../package.json' with { type: 'json' }
import { systemPrompt } from '../docs/prompt'
import { storage } from '../storage'

/**
 * Nanobot PM CLI (citty). Commands: onboard, agent, status, cron.
 */
const main = defineCommand({
  meta: {
    name: 'agentic',
    version: packageJSON.version,
  },
  run: async () => {
    const { config } = await loadConfig<AgenticConfig>({
      name: 'agentic',
    })
    if (!config)
      throw new Error('Config not found')
    let session = await storage.get<string>('session')
    if (!session) {
      const id = await config.fresh()
      session = id.trim()
      await storage.set('session', session)
      await config.reply(session, systemPrompt())
    }
    await config.start(session)
  },
})

runMain(main)
