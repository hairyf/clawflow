/**
 * LLM provider interface.
 * @see sources/nanobot/nanobot/providers/base.py
 */

export interface ToolCallRequest {
  id: string
  name: string
  arguments: Record<string, unknown>
}

export interface LLMResponse {
  content: string | null
  toolCalls: ToolCallRequest[]
  finishReason: string
  usage?: Record<string, number>
}

export function hasToolCalls(r: LLMResponse): boolean {
  return r.toolCalls.length > 0
}

export interface ChatMessage { role: string, content?: string, tool_calls?: unknown[] }

export interface LLMProvider {
  chat: (options: {
    messages: ChatMessage[]
    tools?: unknown[]
    model?: string
    maxTokens?: number
    temperature?: number
  }) => Promise<LLMResponse>
  getDefaultModel: () => string
}
