/**
 * Shell exec tool with safety guards.
 * @see sources/nanobot/nanobot/agent/tools/shell.py
 */

import type { Tool } from './base'
import { exec } from 'node:child_process'
import process from 'node:process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

const DENY_PATTERNS = [
  /\brm\s+-[rf]{1,2}\b/,
  /\bdel\s+\/[fq]\b/,
  /\brmdir\s+\/s\b/,
  /\b(format|mkfs|diskpart)\b/,
  /\bdd\s+if=/,
  />\s*\/dev\/sd/,
  /\b(shutdown|reboot|poweroff)\b/,
]

export function execTool(options: {
  workingDir?: string
  timeout?: number
  restrictToWorkspace?: boolean
}): Tool {
  const timeout = options.timeout ?? 60
  const cwd = options.workingDir ?? process.cwd()
  const restrict = options.restrictToWorkspace ?? false

  return {
    name: 'exec',
    description: 'Execute a shell command and return its output. Use with caution.',
    parameters: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'The shell command to execute' },
        working_dir: { type: 'string', description: 'Optional working directory' },
      },
      required: ['command'],
    },
    async execute({ command, working_dir }: Record<string, unknown>) {
      const cmd = String(command).trim()
      const workDir = (working_dir as string) || cwd

      for (const re of DENY_PATTERNS) {
        if (re.test(cmd.toLowerCase()))
          return 'Error: Command blocked by safety guard (dangerous pattern detected)'
      }
      if (restrict && (cmd.includes('../') || cmd.includes('..\\')))
        return 'Error: Command blocked by safety guard (path traversal detected)'

      try {
        const { stdout, stderr } = await execAsync(cmd, {
          cwd: workDir,
          maxBuffer: 10 * 1024 * 1024,
          timeout: timeout * 1000,
        })
        const out: string[] = []
        if (stdout)
          out.push(stdout)
        if (stderr?.trim())
          out.push(`STDERR:\n${stderr}`)
        let result = out.join('\n') || '(no output)'
        if (result.length > 10000)
          result = `${result.slice(0, 10000)}\n... (truncated, ${result.length - 10000} more chars)`
        return result
      }
      catch (e: any) {
        if (e.killed && e.signal === 'SIGTERM')
          return `Error: Command timed out after ${timeout} seconds`
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}
