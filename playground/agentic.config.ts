import { defineAgentic } from 'agentic-x'
import { x } from 'tinyexec'

const engine = defineAgentic({
  fresh: async () => x('agent create-chat').then(r => r.stdout),
  start: async (session: string) =>
    x('agent', ['--resume', session], { nodeOptions: { stdio: 'inherit' } }),
  reply: async (session: string, message: string) =>
    x('agent', ['-p', message, '--resume', session], { nodeOptions: { stdio: 'inherit' } }),
})

export default engine
