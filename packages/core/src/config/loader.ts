/**
 * Load config with defu. Config file: ~/.clawflow/config.json
 * @see sources/nanobot/nanobot/config/loader.py
 */

import type { ClawflowConfig } from './schema'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { defu } from 'defu'
import { dirname, resolve } from 'pathe'
import { getConfigPath } from '../utils/helpers'
import { defaultConfig } from './schema'

export async function loadConfig(overridePath?: string): Promise<ClawflowConfig> {
  const path = overridePath ?? getConfigPath()
  if (existsSync(path)) {
    try {
      const raw = readFileSync(path, 'utf-8')
      const data = JSON.parse(raw) as ClawflowConfig
      return defu(data, defaultConfig) as ClawflowConfig
    }
    catch (e) {
      console.warn(`Failed to load config from ${path}:`, e)
    }
  }
  return defu({}, defaultConfig) as ClawflowConfig
}

export function saveConfig(config: ClawflowConfig, overridePath?: string): void {
  const path = overridePath ?? getConfigPath()
  const dir = dirname(path)
  if (!existsSync(dir))
    mkdirSync(dir, { recursive: true })
  writeFileSync(path, JSON.stringify(config, null, 2), 'utf-8')
}

/** Resolve workspace absolute path from config */
export function getWorkspacePathFromConfig(config: ClawflowConfig): string {
  const w = config.agents?.defaults?.workspace ?? defaultConfig.agents!.defaults!.workspace
  const expanded = w?.startsWith('~') ? w.replace('~', homedir()) : w ?? ''
  return resolve(expanded)
}

/** Get API key (first available provider) */
export function getApiKey(config: ClawflowConfig, _model?: string): string | undefined {
  const providers = config.providers ?? {}
  const order = [
    providers.openrouter,
    providers.deepseek,
    providers.anthropic,
    providers.openai,
    providers.gemini,
    providers.groq,
    providers.vllm,
  ]
  for (const p of order) {
    if (p?.apiKey)
      return p.apiKey
  }
  return undefined
}

/** Get API base for OpenRouter / vLLM etc. */
export function getApiBase(config: ClawflowConfig, model?: string): string | undefined {
  const modelLower = (model ?? config.agents?.defaults?.model ?? '').toLowerCase()
  if (modelLower.includes('openrouter'))
    return config.providers?.openrouter?.apiBase ?? 'https://openrouter.ai/api/v1'
  if (modelLower.includes('vllm'))
    return config.providers?.vllm?.apiBase
  return undefined
}
