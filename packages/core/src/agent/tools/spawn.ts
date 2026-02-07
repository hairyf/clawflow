/**
 * Spawn tool: run subagent in background, announce result via bus.
 * @see sources/nanobot/nanobot/agent/tools/spawn.py
 */

import type { Tool } from './base.js'

export interface SubagentManagerLike {
  spawn(task: string, label: string | undefined, originChannel: string, originChatId: string): Promise<string>
}

export function spawnTool(manager: SubagentManagerLike): Tool & { setContext(channel: string, chatId: string): void } {
  let originChannel = 'cli'
  let originChatId = 'direct'
  return {
    name: 'spawn',
    description: 'Spawn a subagent to handle a task in the background. The subagent will report back when done.',
    parameters: {
      type: 'object',
      properties: {
        task: { type: 'string', description: 'The task for the subagent to complete' },
        label: { type: 'string', description: 'Optional short label for the task' },
      },
      required: ['task'],
    },
    setContext(ch: string, id: string) {
      originChannel = ch
      originChatId = id
    },
    async execute({ task, label }: Record<string, unknown>) {
      return manager.spawn(String(task), label as string | undefined, originChannel, originChatId)
    },
  }
}
