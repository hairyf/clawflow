import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findProjectRoot, loadConfig } from '../src/config/load.js'

describe('findProjectRoot', () => {
  it('returns dir when .openclaw exists', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-dot-openclaw-'))
    try {
      fs.mkdirSync(path.join(dir, '.openclaw'), { recursive: true })
      expect(findProjectRoot(dir)).toBe(dir)
    }
    finally {
      fs.rmSync(dir, { recursive: true })
    }
  })

  it('returns dir when package.json has clawflow field', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-pkg-'))
    try {
      fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x', clawflow: true }))
      expect(findProjectRoot(dir)).toBe(dir)
    }
    finally {
      fs.rmSync(dir, { recursive: true })
    }
  })
})

describe('loadConfig', () => {
  it('returns resolved config when .openclaw exists', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-load-dot-'))
    try {
      fs.mkdirSync(path.join(dir, '.openclaw'), { recursive: true })
      const resolved = await loadConfig(dir)
      expect(resolved).not.toBeNull()
      expect(resolved!.projectRoot).toBe(dir)
      expect(resolved!.workspaceDir).toBe(path.join(dir, 'src'))
      expect(resolved!.openclawConfigPath).toBe(path.join(dir, '.openclaw', 'openclaw.json'))
    }
    finally {
      fs.rmSync(dir, { recursive: true })
    }
  })

  it('reads workspace from openclaw.json when present', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clawflow-load-json-'))
    try {
      fs.mkdirSync(path.join(dir, '.openclaw'), { recursive: true })
      const openclawPath = path.join(dir, '.openclaw', 'openclaw.json')
      fs.writeFileSync(openclawPath, JSON.stringify({
        agents: { defaults: { workspace: path.join(dir, 'lib') } },
      }))
      const resolved = await loadConfig(dir)
      expect(resolved).not.toBeNull()
      expect(resolved!.workspaceDir).toBe(path.join(dir, 'lib'))
    }
    finally {
      fs.rmSync(dir, { recursive: true })
    }
  })
})
