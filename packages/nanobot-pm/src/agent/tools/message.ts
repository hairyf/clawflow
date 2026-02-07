/**
 * Message tool: send message to user (outbound bus).
 * @see sources/nanobot/nanobot/agent/tools/message.py
 */

import type { OutboundMessage } from '../../bus/events'
import type { Tool } from './base'

export type SendCallback = (msg: OutboundMessage) => Promise<void>

export function messageTool(sendCallback?: SendCallback): Tool & { set_context: (channel: string, chat_id: string) => void } {
  let channel = ''
  let chat_id = ''
  const send = sendCallback ?? (async () => {})

  return {
    name: 'message',
    description: 'Send a message to the user. Use this when you want to communicate something.',
    parameters: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'The message content to send' },
        channel: { type: 'string', description: 'Optional target channel' },
        chat_id: { type: 'string', description: 'Optional target chat/user ID' },
      },
      required: ['content'],
    },
    set_context(ch: string, id: string) {
      channel = ch
      chat_id = id
    },
    async execute({ content, channel: ch, chat_id: cid }: Record<string, unknown>) {
      const c = (ch as string) || channel
      const id = (cid as string) || chat_id
      if (!c || !id)
        return 'Error: No target channel/chat specified'
      try {
        await send({ channel: c, chat_id: id, content: String(content) })
        return `Message sent to ${c}:${id}`
      }
      catch (e: any) {
        return `Error sending message: ${e?.message ?? e}`
      }
    },
  }
}
