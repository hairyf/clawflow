/**
 * OpenAI-compatible provider (OpenRouter, vLLM, etc.) via ofetch.
 * @see sources/nanobot/nanobot/providers/litellm_provider.py
 */

import type { LLMProvider, LLMResponse, ToolCallRequest } from './base.js'
import { destr } from 'destr'
import { ofetch } from 'ofetch'

interface OpenAIMessage {
  role: string
  content?: string
  tool_calls?: Array<{
    id: string
    type: string
    function: { name: string, arguments: string }
  }>
}

interface OpenAIChoice {
  message: OpenAIMessage
  finish_reason?: string
}

interface OpenAIResponse {
  choices?: OpenAIChoice[]
  usage?: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number }
}

export function createOpenAIProvider(options: {
  apiKey?: string
  apiBase?: string
  defaultModel: string
}): LLMProvider {
  const base = options.apiBase ?? 'https://api.openai.com/v1'
  const url = `${base.replace(/\/$/, '')}/chat/completions`
  const defaultModel = options.defaultModel

  return {
    getDefaultModel: () => defaultModel,
    async chat({ messages, tools, model, maxTokens = 4096, temperature = 0.7 }) {
      const body: Record<string, unknown> = {
        model: model ?? defaultModel,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content ?? '',
          ...(m.tool_calls && { tool_calls: m.tool_calls }),
        })),
        max_tokens: maxTokens,
        temperature,
      }
      if (tools && tools.length > 0) {
        body.tools = tools
        body.tool_choice = 'auto'
      }
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (options.apiKey)
        headers.Authorization = `Bearer ${options.apiKey}`

      const res = await ofetch<OpenAIResponse>(url, {
        method: 'POST',
        headers,
        body,
        timeout: 120000,
      })
      const choice = res.choices?.[0]
      if (!choice)
        return { content: 'No response from model', toolCalls: [], finishReason: 'error' }
      const msg = choice.message
      const toolCalls: ToolCallRequest[] = (msg.tool_calls ?? []).map(tc => ({
        id: tc.id,
        name: tc.function.name,
        arguments: destr(tc.function.arguments) as Record<string, unknown>,
      }))
      return {
        content: msg.content ?? null,
        toolCalls,
        finishReason: choice.finish_reason ?? 'stop',
        usage: res.usage
          ? {
              prompt_tokens: res.usage.prompt_tokens,
              completion_tokens: res.usage.completion_tokens,
              total_tokens: res.usage.total_tokens,
            }
          : undefined,
      }
    },
  }
}
