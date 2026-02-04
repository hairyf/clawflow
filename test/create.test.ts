import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { runCreate } from '../src/commands/create.js'

describe('runCreate', () => {
  it('creates project scaffold', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-create-'))
    const projectName = 'my-app'
    try {
      await runCreate(projectName, base)
      const root = path.join(base, projectName)
      expect(fs.existsSync(path.join(root, '.openclaw'))).toBe(true)
      expect(fs.existsSync(path.join(root, '.openclaw', 'openclaw.json'))).toBe(true)
      expect(fs.existsSync(path.join(root, '.collective', 'swarm'))).toBe(true)
      expect(fs.existsSync(path.join(root, '.collective', 'hive-mind'))).toBe(true)
      expect(fs.existsSync(path.join(root, '.collective', 'coordination'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'agents'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'skills'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'src'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'src', 'skills'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'src', 'tools'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'src', 'AGENTS.md'))).toBe(true)
      expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true)
      const openclawJson = JSON.parse(fs.readFileSync(path.join(root, '.openclaw', 'openclaw.json'), 'utf8'))
      expect(openclawJson.$include).toBe('~/.openclaw/openclaw.json')
      expect(openclawJson.agents.defaults.workspace).toContain(projectName)
      expect(openclawJson.agents.defaults.workspace).toContain('src')
    }
    finally {
      fs.rmSync(base, { recursive: true, force: true })
    }
  })

  it('throws when target dir exists and is non-empty', async () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-create-'))
    const projectName = 'existing'
    try {
      const root = path.join(base, projectName)
      fs.mkdirSync(root, { recursive: true })
      fs.writeFileSync(path.join(root, 'file.txt'), 'x')
      await expect(runCreate(projectName, base)).rejects.toThrow(/非空/)
    }
    finally {
      fs.rmSync(base, { recursive: true, force: true })
    }
  })
})
