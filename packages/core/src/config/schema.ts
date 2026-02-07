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
  web?: { search?: { apiKey?: string, maxResults?: number } }
  exec?: { timeout?: number }
  restrictToWorkspace?: boolean
}

/** WhatsApp: connects to Node.js bridge via WebSocket */
export interface WhatsAppChannelConfig extends ChannelConfig {
  bridgeUrl?: string
}

/** Telegram: Bot API long polling */
export interface TelegramChannelConfig extends ChannelConfig {
  token?: string
  proxy?: string
}

/** Discord: Gateway WebSocket + REST */
export interface DiscordChannelConfig extends ChannelConfig {
  token?: string
  gatewayUrl?: string
  intents?: number
}

/** Feishu/Lark: WebSocket long connection */
export interface FeishuChannelConfig extends ChannelConfig {
  appId?: string
  appSecret?: string
  encryptKey?: string
  verificationToken?: string
}

/** Base channel config with index signature for extensibility */
export interface ChannelConfig {
  enabled?: boolean
  allowFrom?: string[]
  [key: string]: unknown
}

export interface ChannelsConfig {
  whatsapp?: WhatsAppChannelConfig
  telegram?: TelegramChannelConfig
  discord?: DiscordChannelConfig
  feishu?: FeishuChannelConfig
}

export interface GatewayConfig {
  host?: string
  port?: number
}

export interface HeartbeatConfig {
  enabled?: boolean
  intervalS?: number
}

/** WhatsApp bridge (WebSocket server + Baileys) */
export interface BridgeConfig {
  port?: number
  authDir?: string
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
  channels?: ChannelsConfig
  gateway?: GatewayConfig
  heartbeat?: HeartbeatConfig
  bridge?: BridgeConfig
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
  channels: {
    whatsapp: { enabled: false, bridgeUrl: 'ws://localhost:3001', allowFrom: [] },
    telegram: { enabled: false, token: '', allowFrom: [] },
    discord: { enabled: false, token: '', allowFrom: [], gatewayUrl: 'wss://gateway.discord.gg/?v=10&encoding=json', intents: 37377 },
    feishu: { enabled: false, appId: '', appSecret: '', allowFrom: [] },
  },
  gateway: { host: '0.0.0.0', port: 18790 },
  heartbeat: { enabled: true, intervalS: 30 * 60 },
  bridge: { port: 3001, authDir: '~/.clawflow/whatsapp-auth' },
}
