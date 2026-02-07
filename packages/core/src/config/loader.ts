/**
 * Load config with defu. Config file: ~/.nanobot-pm/config.json
 * @see sources/nanobot/nanobot/config/loader.py
 */

import type { NanobotPmConfig } from './schema'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import process from 'node:process'
import { defu } from 'defu'
import { dirname, resolve } from 'pathe'
import { get_config_path } from '../utils/helpers'
import { defaultConfig } from './schema'

/**
 * Migrate old config keys to current schema (align nanobot _migrate_config).
 * e.g. tools.exec.restrictToWorkspace → tools.restrictToWorkspace
 */
export function migrate_config(data: Record<string, unknown>): Record<string, unknown> {
  const tools = data.tools as Record<string, unknown> | undefined
  if (!tools)
    return data
  const exec = tools.exec as Record<string, unknown> | undefined
  if (exec && 'restrictToWorkspace' in exec && !('restrictToWorkspace' in tools)) {
    tools.restrictToWorkspace = exec.restrictToWorkspace
    delete exec.restrictToWorkspace
  }
  return data
}

export async function load_config(overridePath?: string): Promise<NanobotPmConfig> {
  const path = overridePath ?? get_config_path()
  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf-8')
      const data = migrate_config(JSON.parse(raw) as Record<string, unknown>) as NanobotPmConfig
      return defu(data, defaultConfig) as NanobotPmConfig
    }
    catch (e) {
      console.warn(`Failed to load config from ${path}:`, e)
    }
  }
  return defu({}, defaultConfig) as NanobotPmConfig
}

export function save_config(config: NanobotPmConfig, overridePath?: string): void {
  const path = overridePath ?? get_config_path()
  const dir = dirname(path)
  if (!existsSync(dir))
    mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8')
}

/** Resolve workspace absolute path from config */
export function get_workspace_path_from_config(config: NanobotPmConfig): string {
  const w = config.agents?.defaults?.workspace ?? defaultConfig.agents!.defaults!.workspace
  const expanded = w?.startsWith('~') ? w.replace('~', homedir()) : w ?? ''
  return resolve(expanded)
}

/** Match provider by model name (align nanobot config._match_provider) */
function match_provider_by_model(config: NanobotPmConfig, model?: string): { apiKey?: string, apiBase?: string } | undefined {
  const providers = config.providers ?? {}
  const m = (model ?? config.agents?.defaults?.model ?? '').toLowerCase()
  const match = (p: typeof providers.openrouter) => p?.apiKey ? p : undefined
  if (m.includes('openrouter') || m.includes('/'))
    return match(providers.openrouter) ?? match(providers.openai)
  if (m.includes('deepseek'))
    return match(providers.deepseek)
  if (m.includes('anthropic') || m.includes('claude'))
    return match(providers.anthropic)
  if (m.includes('groq'))
    return match(providers.groq)
  if (m.includes('gemini') || m.includes('google'))
    return match(providers.gemini)
  if (m.includes('zhipu') || m.includes('glm') || m.includes('zai'))
    return match(providers.zhipu)
  if (m.includes('moonshot') || m.includes('kimi'))
    return match(providers.moonshot)
  if (m.includes('bedrock') || /anthropic\.claude|meta\.|amazon\.|us\.|apac\./.test(m)) {
    const region = providers.bedrock?.region ?? (typeof process !== 'undefined' ? process.env.AWS_REGION : undefined)
    if (region)
      return { apiKey: providers.bedrock?.accessKeyId ?? providers.bedrock?.apiKey ?? process.env.AWS_ACCESS_KEY_ID ?? 'aws', apiBase: region }
    return undefined
  }
  if (m.includes('openai') || m.includes('gpt'))
    return match(providers.openai) ?? match(providers.openrouter)
  if (m.includes('vllm'))
    return providers.vllm?.apiBase ? { apiKey: providers.vllm?.apiKey ?? 'dummy', apiBase: providers.vllm?.apiBase } : undefined
  return undefined
}

/** Get API key (first available provider, or by model when specified) */
export function get_api_key(config: NanobotPmConfig, model?: string): string | undefined {
  const matched = match_provider_by_model(config, model)
  if (matched?.apiKey)
    return matched.apiKey
  const providers = config.providers ?? {}
  const order = [
    providers.openrouter,
    providers.deepseek,
    providers.anthropic,
    providers.openai,
    providers.gemini,
    providers.zhipu,
    providers.moonshot,
    providers.groq,
    providers.vllm,
    providers.bedrock,
  ]
  for (const p of order) {
    if (p?.apiKey)
      return p.apiKey
    if (p && 'region' in p && (p as { region?: string }).region)
      return (p as { accessKeyId?: string }).accessKeyId ?? process.env.AWS_ACCESS_KEY_ID ?? 'aws'
  }
  return undefined
}

/** Get API base for OpenRouter / vLLM etc. (by model) */
export function get_api_base(config: NanobotPmConfig, model?: string): string | undefined {
  const matched = match_provider_by_model(config, model)
  if (matched?.apiBase)
    return matched.apiBase
  const modelLower = (model ?? config.agents?.defaults?.model ?? '').toLowerCase()
  if (modelLower.includes('openrouter') || modelLower.includes('/'))
    return config.providers?.openrouter?.apiBase ?? 'https://openrouter.ai/api/v1'
  if (modelLower.includes('zhipu') || modelLower.includes('glm') || modelLower.includes('zai'))
    return config.providers?.zhipu?.apiBase
  if (modelLower.includes('vllm'))
    return config.providers?.vllm?.apiBase
  if (modelLower.includes('moonshot') || modelLower.includes('kimi'))
    return config.providers?.moonshot?.apiBase ?? 'https://api.moonshot.cn/v1'
  if (modelLower.includes('bedrock') || /anthropic\.claude|meta\.|amazon\.|us\.|apac\./.test(modelLower))
    return config.providers?.bedrock?.region ?? process.env.AWS_REGION
  return undefined
}
