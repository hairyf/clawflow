import { defineCommand, runMain } from 'citty'
import packageJSON from '../../package.json' with { type: 'json' }
import { config } from '../config'
import { session } from '../session'

/**
 * Agentic CLI (citty).
 */
const main = defineCommand({
  meta: {
    name: 'agentic',
    version: packageJSON.version,
  },
  run: async () => {
    const id = await session.main.start()
    await config.agent.start(id)
  },
})

runMain(main)
