/**
 * A/B tests: nanobot-pm agent/skills ↔ nanobot agent/skills.py
 */

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SkillsLoader } from '../../src/agent/skills'

describe('skillsLoader (nanobot a/b)', () => {
  let workspace: string

  beforeEach(() => {
    workspace = mkdtempSync(join(tmpdir(), 'nanobot-pm-skills-'))
    mkdirSync(join(workspace, 'skills', 'foo'), { recursive: true })
    writeFileSync(join(workspace, 'skills', 'foo', 'SKILL.md'), `---
description: Foo skill
always: true
metadata: '{"nanobot":{"always":true,"requires":{"bins":["node"]}}}'
---
# Foo
Body content here.
`)
    mkdirSync(join(workspace, 'skills', 'bar'), { recursive: true })
    writeFileSync(join(workspace, 'skills', 'bar', 'SKILL.md'), `---
description: Bar skill
---
# Bar
Another body.
`)
  })

  afterEach(() => {
    rmSync(workspace, { recursive: true, force: true })
  })

  it('listSkills returns workspace skills', () => {
    const loader = new SkillsLoader(workspace, '')
    const skills = loader.listSkills(false)
    expect(skills.length).toBeGreaterThanOrEqual(2)
    const names = skills.map(s => s.name)
    expect(names).toContain('foo')
    expect(names).toContain('bar')
  })

  it('loadSkill returns file content', () => {
    const loader = new SkillsLoader(workspace, '')
    const content = loader.loadSkill('foo')
    expect(content).toContain('# Foo')
    expect(content).toContain('Body content')
    expect(loader.loadSkill('nonexistent')).toBeNull()
  })

  it('get_skill_metadata parses frontmatter', () => {
    const loader = new SkillsLoader(workspace, '')
    const meta = loader.get_skill_metadata('foo')
    expect(meta?.description).toBe('Foo skill')
    expect(meta?.always).toBe(true)
  })

  it('strip_frontmatter removes --- block', () => {
    const loader = new SkillsLoader(workspace, '')
    const content = loader.loadSkill('foo')!
    const body = loader.strip_frontmatter(content)
    expect(body).not.toContain('---')
    expect(body).toContain('# Foo')
  })

  it('parseNanobotMetadata parses JSON', () => {
    const loader = new SkillsLoader(workspace, '')
    const meta = loader.get_skill_meta('foo')
    expect(meta.always).toBe(true)
    expect(meta.requires?.bins).toContain('node')
  })

  it('buildSkillsSummary produces XML', () => {
    const loader = new SkillsLoader(workspace, '')
    const summary = loader.buildSkillsSummary()
    expect(summary).toContain('<skills>')
    expect(summary).toContain('<skill')
    expect(summary).toContain('<name>foo</name>')
  })

  it('get_always_skills returns always skills', () => {
    const loader = new SkillsLoader(workspace, '')
    const always = loader.get_always_skills()
    expect(always).toContain('foo')
  })

  it('load_skills_for_context concatenates bodies', () => {
    const loader = new SkillsLoader(workspace, '')
    const ctx = loader.load_skills_for_context(['foo', 'bar'])
    expect(ctx).toContain('Skill: foo')
    expect(ctx).toContain('Body content')
    expect(ctx).toContain('Skill: bar')
    expect(ctx).toContain('Another body')
  })
})
