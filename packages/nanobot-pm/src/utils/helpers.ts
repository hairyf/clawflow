/**
 * Path and env helpers. Uses pathe for cross-platform paths.
 * @see sources/nanobot/nanobot/utils/helpers.py
 */

import { existsSync, mkdirSync } from 'node:fs'
import { homedir, platform } from 'node:os'
import process from 'node:process'
import { join, resolve } from 'pathe'

const DATA_DIR = join(homedir(), '.nanobot-pm')

export function ensure_dir(path: string): string {
  if (!existsSync(path))
    mkdirSync(path, { recursive: true })
  return path
}

export function get_data_path(): string {
  return ensure_dir(DATA_DIR)
}

export function get_config_path(): string {
  return join(get_data_path(), 'config.json')
}

export function get_workspace_path(workspace?: string): string {
  const base = workspace ? resolve(workspace.replace(/^~/, homedir())) : join(DATA_DIR, 'workspace')
  return ensure_dir(base)
}

export function get_sessions_path(): string {
  return ensure_dir(join(get_data_path(), 'sessions'))
}

export function get_memory_path(workspace?: string): string {
  const ws = workspace ?? get_workspace_path()
  return ensure_dir(join(ws, 'memory'))
}

export function get_skills_path(workspace?: string): string {
  const ws = workspace ?? get_workspace_path()
  return ensure_dir(join(ws, 'skills'))
}

export function get_cron_store_path(): string {
  return join(ensure_dir(join(get_data_path(), 'cron')), 'jobs.json')
}

export function today_date(): string {
  return new Date().toISOString().slice(0, 10)
}

export function timestamp(): string {
  return new Date().toISOString()
}

export function safe_filename(name: string): string {
  return name.replace(/[<>:"/\\|?*]/g, '_').trim()
}

/**
 * Truncate a string to max length, adding suffix if truncated.
 * @see sources/nanobot/nanobot/utils/helpers.py truncate_string
 */
export function truncate_string(s: string, maxLen = 100, suffix = '...'): string {
  if (s.length <= maxLen)
    return s
  return s.slice(0, maxLen - suffix.length) + suffix
}

/**
 * Parse a session key into channel and chat_id.
 * @param key Session key in format "channel:chat_id"
 * @returns Tuple of [channel, chat_id]
 * @see sources/nanobot/nanobot/utils/helpers.py parse_session_key
 */
export function parse_session_key(key: string): [string, string] {
  const i = key.indexOf(':')
  if (i < 0)
    throw new Error(`Invalid session key: ${key}`)
  return [key.slice(0, i), key.slice(i + 1)]
}

export function get_runtime_info(): string {
  const sys = platform()
  const label = sys === 'darwin' ? 'macOS' : sys
  return `${label} ${process.arch}, Node ${process.version}`
}
