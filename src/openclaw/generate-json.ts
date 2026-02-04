import fs from 'node:fs'
import path from 'node:path'

/**
 * 在项目内生成最小 .openclaw/openclaw.json，由 OpenClaw 接管后续配置。
 * 仅写入 $include 与 agents.defaults.workspace。
 */
export function generateOpenClawJson(projectRoot: string, workspaceDir: string): void {
  const openclawDir = path.join(projectRoot, '.openclaw')
  const openclawConfigPath = path.join(openclawDir, 'openclaw.json')
  if (!fs.existsSync(openclawDir))
    fs.mkdirSync(openclawDir, { recursive: true })

  const openclawJson = {
    $include: '~/.openclaw/openclaw.json',
    agents: {
      defaults: {
        workspace: workspaceDir,
      },
    },
  }
  fs.writeFileSync(openclawConfigPath, `${JSON.stringify(openclawJson, null, 2)}\n`, 'utf8')
}
