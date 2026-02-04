import type { ResolvedConfig } from './types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * 向上查找项目根：以 .openclaw 目录或 package.json 中 clawflow 字段为标记。
 */
export function findProjectRoot(cwd: string): string | null {
  let dir = path.resolve(cwd)
  const root = path.parse(dir).root
  while (dir !== root) {
    if (fs.existsSync(path.join(dir, '.openclaw')))
      return dir
    const pkgPath = path.join(dir, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        if (pkg.clawflow !== undefined)
          return dir
      }
      catch { /* ignore */ }
    }
    dir = path.dirname(dir)
  }
  return null
}

/**
 * 从当前工作目录向上查找项目根，并解析委托所需的路径。
 * 工作区取自 .openclaw/openclaw.json 的 agents.defaults.workspace，若无则默认为 projectRoot/src。
 */
export async function loadConfig(cwd: string = process.cwd()): Promise<ResolvedConfig | null> {
  const projectRoot = findProjectRoot(cwd)
  if (!projectRoot)
    return null

  const openclawDir = path.join(projectRoot, '.openclaw')
  const openclawConfigPath = path.join(openclawDir, 'openclaw.json')

  let workspaceDir = path.join(projectRoot, 'src')
  if (fs.existsSync(openclawConfigPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(openclawConfigPath, 'utf8'))
      const w = raw?.agents?.defaults?.workspace
      if (typeof w === 'string' && w)
        workspaceDir = path.isAbsolute(w) ? w : path.resolve(projectRoot, w)
    }
    catch { /* 解析失败则用默认 */ }
  }

  return {
    projectRoot,
    workspaceDir,
    openclawDir,
    openclawConfigPath,
  }
}
