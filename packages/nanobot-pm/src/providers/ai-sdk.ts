/**
 * Multi-provider support via Vercel AI SDK (@ai-sdk/*).
 * Resolves model -> provider (OpenRouter, Anthropic, OpenAI, Google, Groq, DeepSeek, Zhipu, Moonshot).
 * @see https://github.com/vercel/ai
 * @see https://ai-sdk.dev/docs
 */

import type { ModelMessage } from 'ai'
import type { NanobotPmConfig } from '../config/schema'
import type { LLMProvider, ToolCallRequest } from './base'
import process from 'node:process'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createDeepSeek } from '@ai-sdk/deepseek'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createGroq } from '@ai-sdk/groq'
import { createOpenAI } from '@ai-sdk/openai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { dynamicTool, generateText, stepCountIs } from 'ai'
import { createZhipu } from 'zhipu-ai-provider'
import { z } from 'zod'

export type ToolExecutor = (name: string, args: Record<string, unknown>) => Promise<string>

/** Incoming tool message (OpenAI-style) */
interface IncomingToolMessage {
  role: 'tool'
  content?: string
  tool_call_id?: string
  tool_name?: string
}

/** Incoming assistant message with tool_calls */
interface IncomingAssistantMessage {
  role: 'assistant'
  content?: string
  tool_calls?: Array<{ id: string, function: { name: string, arguments: string } }>
}

/** Incoming user content: text or multimodal (image_url + text). Converted to SDK ImagePart/TextPart in toCoreMessages. */
type IncomingUserContent = string | Array<
  | { type: 'text', text: string }
  | { type: 'image_url', image_url: { url: string } }
>

/** Incoming chat message union */
type IncomingMessage
  = | { role: 'system', content?: string }
    | { role: 'user', content?: IncomingUserContent }
    | IncomingAssistantMessage
    | IncomingToolMessage

function createModel(config: NanobotPmConfig, modelName: string) {
  const m = modelName.toLowerCase()
  const providers = config.providers ?? {}

  if (m.includes('bedrock') || /anthropic\.claude|meta\.|amazon\.|us\.|apac\./.test(m)) {
    const p = providers.bedrock
    const region = p?.region ?? (typeof process !== 'undefined' ? process.env.AWS_REGION : undefined)
    if (!region)
      throw new Error(`AWS Bedrock region required. Set providers.bedrock.region or AWS_REGION for model: ${modelName}`)
    const bedrock = createAmazonBedrock({
      region,
      ...(p?.accessKeyId && p?.secretAccessKey && {
        accessKeyId: p.accessKeyId,
        secretAccessKey: p.secretAccessKey,
        ...(p.sessionToken && { sessionToken: p.sessionToken }),
      }),
      ...(p?.apiKey && { apiKey: p.apiKey }),
    })
    return bedrock(modelName)
  }

  if (m.includes('anthropic') || m.includes('claude')) {
    const p = providers.anthropic
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    if (!apiKey)
      throw new Error(`Anthropic API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : modelName
    return createAnthropic({ apiKey })(modelId)
  }

  if (m.includes('deepseek')) {
    const p = providers.deepseek
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    if (!apiKey)
      throw new Error(`DeepSeek API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : 'deepseek-chat'
    return createDeepSeek({ apiKey })(modelId)
  }

  if (m.includes('groq')) {
    const p = providers.groq
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    if (!apiKey)
      throw new Error(`Groq API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : 'llama-3.1-70b-versatile'
    return createGroq({ apiKey })(modelId)
  }

  if (m.includes('gemini') || m.includes('google')) {
    const p = providers.gemini
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    if (!apiKey)
      throw new Error(`Google/Gemini API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : 'gemini-1.5-flash'
    return createGoogleGenerativeAI({ apiKey })(modelId)
  }

  if (m.includes('openai') || m.includes('gpt')) {
    const p = providers.openai ?? providers.openrouter
    const apiKey = p?.apiKey ?? providers.anthropic?.apiKey
    const apiBase = p?.apiBase
    if (!apiKey)
      throw new Error(`OpenAI API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : 'gpt-4o'
    const openaiProvider = createOpenAI(apiBase ? { apiKey, baseURL: apiBase } : { apiKey })
    return openaiProvider(modelId)
  }

  if (m.includes('vllm')) {
    const p = providers.vllm
    const apiBase = p?.apiBase ?? 'http://localhost:8000/v1'
    const apiKey = p?.apiKey ?? 'dummy'
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : modelName
    return createOpenAI({ apiKey, baseURL: apiBase })(modelId)
  }

  if (m.includes('zhipu') || m.includes('glm') || m.includes('zai')) {
    const p = providers.zhipu
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    if (!apiKey)
      throw new Error(`Zhipu API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : modelName.replace(/^(zai|zhipu)\//i, '')
    const zhipu = createZhipu({ apiKey, baseURL: p?.apiBase })
    return zhipu(modelId || 'glm-4-flash')
  }

  if (m.includes('moonshot') || m.includes('kimi')) {
    const p = providers.moonshot
    const apiKey = p?.apiKey ?? providers.openrouter?.apiKey
    const apiBase = p?.apiBase ?? 'https://api.moonshot.cn/v1'
    if (!apiKey)
      throw new Error(`Moonshot API key required for model: ${modelName}`)
    const modelId = modelName.includes('/') ? modelName.split('/').pop()! : modelName.replace(/^moonshot\//i, '')
    return createOpenAI({ apiKey, baseURL: apiBase })(modelId || 'moonshot-v1-8k')
  }

  if (m.includes('openrouter') || m.includes('/')) {
    const p = providers.openrouter ?? providers.openai
    const apiKey = p?.apiKey ?? providers.anthropic?.apiKey
    const apiBase = p?.apiBase ?? 'https://openrouter.ai/api/v1'
    if (!apiKey)
      throw new Error(`OpenRouter/OpenAI API key required for model: ${modelName}`)
    const openrouter = createOpenRouter({ apiKey, baseURL: apiBase })
    return openrouter(modelName)
  }

  const p = providers.openrouter ?? providers.anthropic ?? providers.openai ?? providers.deepseek
  const apiKey = p?.apiKey
  if (!apiKey)
    throw new Error(`No API key configured for model: ${modelName}`)
  const openrouter = createOpenRouter({ apiKey, baseURL: providers.openrouter?.apiBase ?? 'https://openrouter.ai/api/v1' })
  return openrouter(modelName)
}

function toCoreMessages(messages: IncomingMessage[]): ModelMessage[] {
  const out: ModelMessage[] = []
  for (const m of messages) {
    if (m.role === 'system') {
      out.push({ role: 'system', content: m.content ?? '' })
    }
    else if (m.role === 'user') {
      const u = m as IncomingMessage & { role: 'user', content?: IncomingUserContent }
      const raw = u.content ?? ''
      const content = typeof raw === 'string'
        ? raw
        : raw.map((part): { type: 'text', text: string } | { type: 'image', image: URL } => {
            if (part.type === 'text')
              return { type: 'text', text: part.text }
            return { type: 'image', image: new URL(part.image_url.url) }
          })
      out.push({ role: 'user', content } as ModelMessage)
    }
    else if (m.role === 'assistant') {
      const assistant = m as IncomingAssistantMessage
      const toolCalls = assistant.tool_calls
      if (toolCalls?.length) {
        const parts: Array<{ type: 'text', text: string } | { type: 'tool-call', toolCallId: string, toolName: string, args: unknown }> = []
        if (assistant.content)
          parts.push({ type: 'text', text: assistant.content })
        for (const tc of toolCalls) {
          let args: unknown = {}
          try {
            args = JSON.parse(tc.function.arguments)
          }
          catch {
            /* ignore */
          }
          parts.push({ type: 'tool-call', toolCallId: tc.id, toolName: tc.function.name, args })
        }
        out.push({ role: 'assistant', content: parts } as ModelMessage)
      }
      else {
        out.push({ role: 'assistant', content: assistant.content ?? '' })
      }
    }
    else if (m.role === 'tool') {
      const toolMsg = m as IncomingToolMessage
      const toolCallId = toolMsg.tool_call_id ?? ''
      const toolName = toolMsg.tool_name ?? 'unknown'
      const text = toolMsg.content ?? ''
      out.push({
        role: 'tool',
        content: [{ type: 'tool-result' as const, toolCallId, toolName, output: { type: 'text' as const, value: text } }],
      })
    }
  }
  return out
}

function toUsageRecord(usage: { inputTokens?: number, outputTokens?: number, totalTokens?: number } | undefined): Record<string, number> | undefined {
  if (!usage)
    return undefined
  const r: Record<string, number> = {}
  if (usage.inputTokens != null)
    r.promptTokens = usage.inputTokens
  if (usage.outputTokens != null)
    r.completionTokens = usage.outputTokens
  if (usage.totalTokens != null)
    r.totalTokens = usage.totalTokens
  return Object.keys(r).length ? r : undefined
}

export interface CreateAISDKProviderOptions {
  config: NanobotPmConfig
  defaultModel: string
}

export function create_ai_sdk_provider(options: CreateAISDKProviderOptions): LLMProvider {
  const { config, defaultModel } = options

  return {
    getDefaultModel: () => defaultModel,
    async chat(options) {
      const {
        messages,
        tools: toolDefs,
        model: modelOverride,
        maxTokens = 4096,
        temperature = 0.7,
        executeTool,
        maxIterations = 20,
      } = options as {
        messages: Array<{ role: string, content?: string, tool_calls?: unknown[] }>
        tools?: Array<{ type: string, function: { name: string, description: string, parameters?: Record<string, unknown> } }>
        model?: string
        maxTokens?: number
        temperature?: number
        executeTool?: ToolExecutor
        maxIterations?: number
      }
      const modelName = modelOverride ?? defaultModel
      const llm = createModel(config, modelName)
      const temp = modelName.toLowerCase().includes('kimi-k2.5') ? 1.0 : temperature

      if (!toolDefs?.length || !executeTool) {
        const result = await generateText({
          model: llm,
          messages: toCoreMessages(messages as IncomingMessage[]),
          maxOutputTokens: maxTokens,
          temperature: temp,
        })
        return {
          content: result.text ?? null,
          toolCalls: [],
          finishReason: result.finishReason ?? 'stop',
          usage: toUsageRecord(result.usage),
        }
      }

      const toolsMap: Record<string, ReturnType<typeof dynamicTool>> = {}
      for (const t of toolDefs) {
        const fn = t.function
        toolsMap[fn.name] = dynamicTool({
          description: fn.description ?? '',
          inputSchema: z.object({}),
          execute: async (input: unknown) => {
            const args = (typeof input === 'object' && input !== null && !Array.isArray(input))
              ? input as Record<string, unknown>
              : {}
            return executeTool(fn.name, args)
          },
        })
      }

      const result = await generateText({
        model: llm,
        messages: toCoreMessages(messages as IncomingMessage[]),
        tools: toolsMap,
        maxOutputTokens: maxTokens,
        temperature: temp,
        stopWhen: stepCountIs(maxIterations),
      })

      const toolCalls: ToolCallRequest[] = (result.toolCalls ?? []).map((tc) => {
        const args = 'args' in tc ? tc.args : ('input' in tc ? tc.input : {})
        return {
          id: tc.toolCallId,
          name: tc.toolName,
          arguments: (args ?? {}) as Record<string, unknown>,
        }
      })

      return {
        content: result.text ?? null,
        toolCalls,
        finishReason: result.finishReason ?? 'stop',
        usage: toUsageRecord(result.usage),
      }
    },
  }
}
