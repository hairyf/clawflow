export interface AgenticConfig {
  fresh: (system: string) => Promise<string>
  start: (session: string) => Promise<any>
  reply: (session: string, message: string) => Promise<any>
}

export function defineAgentic(config: AgenticConfig) {
  return config
}
