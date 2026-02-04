import fs from 'node:fs'
import path from 'node:path'

/**
 * Generate minimal .openclaw/openclaw.json in the project; OpenClaw takes over subsequent config.
 * Only writes $include and agents.defaults.workspace.
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
