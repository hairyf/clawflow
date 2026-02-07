/**
 * A/B tests: clawflow config/loader ↔ nanobot config/loader.py
 */

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { get_api_base, get_api_key, get_workspace_path_from_config, load_config, migrate_config, save_config } from '../../src/config/loader'
import { defaultConfig } from '../../src/config/schema'

describe('config/loader (nanobot a/b)', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'clawflow-cfg-'))
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('load_config returns default when file missing', async () => {
    const cfg = await load_config(join(tmpDir, 'nonexistent.json'))
    expect(cfg.agents?.defaults?.model).toBeDefined()
    expect(cfg.tools).toBeDefined()
  })

  it('load_config loads from file', async () => {
    const path = join(tmpDir, 'config.json')
    writeFileSync(path, JSON.stringify({ agents: { defaults: { model: 'custom/model' } } }))
    const cfg = await load_config(path)
    expect(cfg.agents?.defaults?.model).toBe('custom/model')
  })

  it('migrate_config moves restrictToWorkspace from exec to tools', () => {
    const data = {
      tools: {
        exec: { timeout: 30, restrictToWorkspace: true },
      },
    }
    const migrated = migrate_config(data) as any
    expect(migrated.tools.restrictToWorkspace).toBe(true)
    expect(migrated.tools.exec.restrictToWorkspace).toBeUndefined()
  })

  it('save_config and load_config roundtrip', async () => {
    const path = join(tmpDir, 'config.json')
    const cfg = { ...defaultConfig, agents: { defaults: { model: 'saved/model' } } }
    save_config(cfg as any, path)
    const loaded = await load_config(path)
    expect(loaded.agents?.defaults?.model).toBe('saved/model')
  })

  it('get_workspace_path_from_config resolves path', () => {
    const path = get_workspace_path_from_config(defaultConfig as any)
    expect(path).toBeTruthy()
    expect(typeof path).toBe('string')
  })

  it('get_api_key matches provider by model (nanobot _match_provider)', () => {
    const cfg = {
      providers: {
        anthropic: { apiKey: 'anthropic-key' },
        openai: { apiKey: 'openai-key' },
        openrouter: { apiKey: 'openrouter-key' },
        deepseek: { apiKey: 'deepseek-key' },
        groq: { apiKey: 'groq-key' },
      },
    } as any
    // model with / matches openrouter first (openrouter route)
    expect(get_api_key(cfg, 'openrouter/meta-llama')).toBe('openrouter-key')
    // anthropic/claude matches openrouter (has /) then openai; use model without / for anthropic
    expect(get_api_key(cfg, 'claude-sonnet')).toBe('anthropic-key')
    expect(get_api_key(cfg, 'deepseek-chat')).toBe('deepseek-key')
    expect(get_api_key(cfg, 'groq-llama')).toBe('groq-key')
  })

  it('get_api_base returns openrouter base for / model (nanobot)', () => {
    const cfg = { providers: { openrouter: { apiBase: 'https://openrouter.ai/api/v1' } } } as any
    expect(get_api_base(cfg, 'openrouter/llama')).toContain('openrouter')
  })

  it('get_api_key falls back to first provider with apiKey when model not matched', () => {
    const cfg = { providers: { anthropic: { apiKey: 'first' }, openai: { apiKey: 'second' } } } as any
    expect(get_api_key(cfg, 'unknown-model')).toBe('first')
  })
})
