/**
 * A/B tests: nanobot-pm agent/tools/shell ↔ nanobot agent/tools/shell.py
 * Uses vi.mock to avoid real exec.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { execTool } from '../../../src/agent/tools/shell'

const mockExec = vi.fn()

vi.mock('node:child_process', () => ({
  exec: (...args: unknown[]) => mockExec(...args),
}))

vi.mock('node:util', () => ({
  promisify: (fn: (...a: unknown[]) => Promise<unknown>) => fn,
}))

describe('execTool (nanobot a/b)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('blocks rm -rf (nanobot deny_patterns)', async () => {
    const tool = execTool({})
    const r = await tool.execute({ command: 'rm -rf /tmp/x' })
    expect(r).toBe('Error: Command blocked by safety guard (dangerous pattern detected)')
    expect(mockExec).not.toHaveBeenCalled()
  })

  it('blocks rm -r (nanobot deny_patterns)', async () => {
    const tool = execTool({})
    const r = await tool.execute({ command: 'rm -r dir' })
    expect(r).toContain('safety guard')
  })

  it('blocks shutdown/reboot (nanobot deny_patterns)', async () => {
    const tool = execTool({})
    expect(await tool.execute({ command: 'shutdown -h now' })).toContain('safety guard')
    expect(await tool.execute({ command: 'reboot' })).toContain('safety guard')
  })

  it('blocks path traversal when restrictToWorkspace', async () => {
    const tool = execTool({ restrictToWorkspace: true, workingDir: '/workspace' })
    const r = await tool.execute({ command: 'cat ../etc/passwd' })
    expect(r).toBe('Error: Command blocked by safety guard (path traversal detected)')
  })

  it('returns stdout (nanobot output format)', async () => {
    mockExec.mockResolvedValueOnce({ stdout: 'hello\n', stderr: '' })
    const tool = execTool({})
    const r = await tool.execute({ command: 'echo hello' })
    expect(r).toBe('hello\n')
  })

  it('appends STDERR when stderr present (nanobot format)', async () => {
    mockExec.mockResolvedValueOnce({ stdout: 'out', stderr: 'warn' })
    const tool = execTool({})
    const r = await tool.execute({ command: 'cmd' })
    expect(r).toContain('STDERR:')
    expect(r).toContain('warn')
  })

  it('returns (no output) when empty (nanobot)', async () => {
    mockExec.mockResolvedValueOnce({ stdout: '', stderr: '' })
    const tool = execTool({})
    const r = await tool.execute({ command: 'true' })
    expect(r).toBe('(no output)')
  })

  it('truncates long output at 10000 chars (nanobot max_len)', async () => {
    const long = 'x'.repeat(15000)
    mockExec.mockResolvedValueOnce({ stdout: long, stderr: '' })
    const tool = execTool({})
    const r = await tool.execute({ command: 'cmd' })
    expect(r).toContain('(truncated, 5000 more chars)')
  })

  it('returns timeout error when exec times out (nanobot)', async () => {
    const err = new Error('killed')
    ;(err as any).killed = true
    ;(err as any).signal = 'SIGTERM'
    mockExec.mockRejectedValueOnce(err)
    const tool = execTool({ timeout: 10 })
    const r = await tool.execute({ command: 'sleep 999' })
    expect(r).toContain('timed out after 10 seconds')
  })

  it('returns generic error on exec failure', async () => {
    mockExec.mockRejectedValueOnce(new Error('command not found'))
    const tool = execTool({})
    const r = await tool.execute({ command: 'nonexistent_cmd_xyz' })
    expect(r).toContain('Error:')
  })
})
