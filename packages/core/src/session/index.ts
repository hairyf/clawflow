import { config } from '../config'
import { systemPrompt } from '../docs/prompt'
import { storage } from '../storage'

export const session = {
  main: {
    async start(prompt?: string) {
      await config.ready()
      let session = await storage.get<string>('session:main')
      if (!session) {
        session = await config.agent.fresh(systemPrompt(), prompt)
        await storage.set('session:main', session)
      }
      return session
    },
    async reply(prompt?: string) {
      await config.ready()
      prompt && await config.agent.reply(await this.start(), prompt)
    },
    async clear() {
      await storage.removeItem('session:main')
      await this.start()
    },
  },
  swarm: {

  },
}
