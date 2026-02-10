import { randomUUID } from 'node:crypto'
import { defineAgentic } from 'agentic-x'
import { x } from 'tinyexec'

const agentic = defineAgentic({
  // 初始化系统会话、返回会话 ID
  fresh: async (system: string) => {
    const sessionId = randomUUID()
    await x(
      'claude',
      [
        ...['--session-id', sessionId],
        ...['--append-system-prompt', system],
        ...['-p', 'init'],
      ],
      {
        nodeOptions: { stdio: 'inherit' },
      },
    )
    return sessionId
  },
  // 启动交互模式
  start: async (session: string) =>
    x('claude', ['-r', session], { nodeOptions: { stdio: 'inherit' } }),
  // 系统内部对话
  reply: async (session: string, message: string) =>
    x('claude', ['-p', message, '-r', session], { nodeOptions: { stdio: 'inherit' } }),
})

export default agentic
