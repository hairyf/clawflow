/**
 * 解析后的项目上下文（由 .openclaw 或 package.json 识别），供 CLI 委托 openclaw 使用。
 * 配置由 OpenClaw 接管，直接使用 .openclaw/openclaw.json。
 */
export interface ResolvedConfig {
  projectRoot: string
  /** 工作区绝对路径（与 openclaw.json agents.defaults.workspace 一致） */
  workspaceDir: string
  openclawDir: string
  openclawConfigPath: string
}
