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
  /** Token usage: promptTokens, completionTokens, totalTokens, etc. */
  usage?: Record<string, number>
}

export function hasToolCalls(r: LLMResponse): boolean {
  return r.toolCalls.length > 0
}

export interface ChatMessage { role: string, content?: string, tool_calls?: unknown[] }

export type ToolExecutor = (name: string, args: Record<string, unknown>) => Promise<string>

export interface LLMProvider {
  chat: (options: {
    messages: ChatMessage[]
    tools?: unknown[]
    model?: string
    maxTokens?: number
    temperature?: number
    /** Used by AI SDK provider for tool execution in generateText loop */
    executeTool?: ToolExecutor
    maxIterations?: number
  }) => Promise<LLMResponse>
  getDefaultModel: () => string
}
