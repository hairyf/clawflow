import type { ResolvedConfig } from './types.js'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

/**
 * Walk upward to find project root: marked by .openclaw directory or clawflow field in package.json.
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
      catch { /* use default on parse failure */ }
    }
    dir = path.dirname(dir)
  }
  return null
}

/**
 * Find project root from current working directory and resolve paths needed for delegation.
 * Workspace is taken from agents.defaults.workspace in .openclaw/openclaw.json; defaults to projectRoot/src if absent.
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
    catch { /* use default on parse failure */ }
  }

  return {
    projectRoot,
    workspaceDir,
    openclawDir,
    openclawConfigPath,
  }
}
