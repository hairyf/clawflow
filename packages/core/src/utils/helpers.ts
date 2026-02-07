/**
 * Path and env helpers. Uses pathe for cross-platform paths.
 * @see sources/nanobot/nanobot/utils/helpers.py
 */

import { existsSync, mkdirSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import { join, resolve } from 'pathe'

const DATA_DIR = join(homedir(), '.clawflow')

export function ensureDir(path: string): string {
  if (!existsSync(path))
    mkdirSync(path, { recursive: true })
  return path
}

export function getDataPath(): string {
  return ensureDir(DATA_DIR)
}

export function getConfigPath(): string {
  return join(getDataPath(), 'config.json')
}

export function getWorkspacePath(workspace?: string): string {
  const base = workspace ? resolve(workspace.replace(/^~/, homedir())) : join(DATA_DIR, 'workspace')
  return ensureDir(base)
}

export function getSessionsPath(): string {
  return ensureDir(join(getDataPath(), 'sessions'))
}

export function getMemoryPath(workspace?: string): string {
  const ws = workspace ?? getWorkspacePath()
  return ensureDir(join(ws, 'memory'))
}

export function getCronStorePath(): string {
  return join(ensureDir(join(getDataPath(), 'cron')), 'jobs.json')
}

export function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export function timestamp(): string {
  return new Date().toISOString()
}

export function safeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim()
}

export function getRuntimeInfo(): string {
  const sys = platform()
  const label = sys === 'darwin' ? 'macOS' : sys
  return `${label} ${process.arch}, Node ${process.version}`
}
