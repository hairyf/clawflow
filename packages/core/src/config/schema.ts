/**
 * Configuration schema (camelCase for JSON).
 * @see sources/nanobot/nanobot/config/schema.py
 */

export interface ProviderConfig {
  apiKey?: string
  apiBase?: string
}

export interface AgentDefaults {
  workspace?: string
  model?: string
  maxTokens?: number
  temperature?: number
  maxToolIterations?: number
}

export interface ToolsConfig {
  web?: { search?: { apiKey?: string; maxResults?: number } }
  exec?: { timeout?: number }
  restrictToWorkspace?: boolean
}

export interface ClawflowConfig {
  agents?: { defaults?: AgentDefaults }
  providers?: {
    openrouter?: ProviderConfig
    anthropic?: ProviderConfig
    openai?: ProviderConfig
    deepseek?: ProviderConfig
    groq?: ProviderConfig
    vllm?: ProviderConfig
    gemini?: ProviderConfig
  }
  tools?: ToolsConfig
}

export const defaultConfig: ClawflowConfig = {
  agents: {
    defaults: {
      workspace: '~/.clawflow/workspace',
      model: 'anthropic/claude-sonnet-4',
      maxTokens: 8192,
      temperature: 0.7,
      maxToolIterations: 20,
    },
  },
  providers: {},
  tools: {
    web: { search: { apiKey: '', maxResults: 5 } },
    exec: { timeout: 60 },
    restrictToWorkspace: false,
  },
}
