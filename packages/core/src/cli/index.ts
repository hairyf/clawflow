import type { AgenticConfig } from '../config'
import { loadConfig } from 'c12'
import { defineCommand, runMain } from 'citty'
import packageJSON from '../../package.json' with { type: 'json' }
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
      name: 'agentic.config',
    })
    if (!config)
      throw new Error('Config not found')
  },
})

runMain(main)
