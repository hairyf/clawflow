/**
 * Resolved project context (identified by .openclaw or package.json), used by CLI to delegate to openclaw.
 * Config is managed by OpenClaw; uses .openclaw/openclaw.json directly.
 */
export interface ResolvedConfig {
  projectRoot: string
  /** Absolute workspace path (matches openclaw.json agents.defaults.workspace) */
  workspaceDir: string
  openclawDir: string
  openclawConfigPath: string
}
