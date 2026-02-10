export interface AgenticConfig {
  fresh: () => Promise<string>
  start: (session: string) => Promise<string>
  reply: (session: string, message: string) => Promise<string>
}

export function defineAgentic(config: AgenticConfig) {
  return config
}
