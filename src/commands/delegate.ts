import type { ResolvedConfig } from '../config/types.js'
import { spawn } from 'node:child_process'
import process from 'node:process'

const OPENCLAW_BIN = 'openclaw'

/**
 * 在项目上下文中执行 openclaw 子命令：设置 OPENCLAW_CONFIG_PATH、OPENCLAW_STATE_DIR 后 spawn。
 */
export function runOpenClaw(resolved: ResolvedConfig, args: string[]): Promise<number> {
  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      OPENCLAW_CONFIG_PATH: resolved.openclawConfigPath,
      OPENCLAW_STATE_DIR: resolved.openclawDir,
    }
    const isWin = process.platform === 'win32'
    const child = spawn(OPENCLAW_BIN, args, {
      stdio: 'inherit',
      env,
      shell: isWin,
    })
    child.on('error', reject)
    child.on('close', (code, signal) => {
      if (signal)
        reject(new Error(`openclaw 被信号终止: ${signal}`))
      else
        resolve(code ?? 0)
    })
  })
}
