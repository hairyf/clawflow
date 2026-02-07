/**
 * Skills loader: list/load SKILL.md from workspace/skills and optional builtin skills.
 * @see sources/nanobot/nanobot/agent/skills.py
 */

import { execSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { dirname } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { join } from 'pathe'

export interface SkillInfo {
  name: string
  path: string
  source: 'workspace' | 'builtin'
}

export interface SkillMetadata {
  description?: string
  always?: boolean
  metadata?: string
}

/** Nanobot-style metadata from frontmatter (JSON in metadata field). */
export interface NanobotSkillMeta {
  always?: boolean
  requires?: { bins?: string[], env?: string[] }
}

function getDefaultBuiltinSkillsDir(): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const distSkills = join(__dirname, '..', 'skills')
    if (existsSync(distSkills))
      return distSkills
    const coreSkills = join(__dirname, '..', '..', 'skills')
    if (existsSync(coreSkills))
      return coreSkills
  }
  catch {
    // ignore
  }
  return ''
}

function whichSync(bin: string): boolean {
  try {
    const cmd = process.platform === 'win32' ? `where ${bin}` : `which ${bin}`
    execSync(cmd, { stdio: 'ignore' })
    return true
  }
  catch {
    return false
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export class SkillsLoader {
  private workspaceSkillsDir: string
  private builtinSkillsDir: string

  constructor(workspace: string, builtinSkillsDir?: string) {
    this.workspaceSkillsDir = join(workspace, 'skills')
    this.builtinSkillsDir = builtinSkillsDir ?? getDefaultBuiltinSkillsDir()
  }

  /** List skill dirs in a directory; returns SkillInfo[] with given source. */
  private listInDir(dir: string, source: 'workspace' | 'builtin'): SkillInfo[] {
    const skills: SkillInfo[] = []
    if (!existsSync(dir))
      return skills
    for (const name of readdirSync(dir)) {
      const skillPath = join(dir, name, 'SKILL.md')
      if (existsSync(skillPath))
        skills.push({ name, path: skillPath, source })
    }
    return skills
  }

  listSkills(filterUnavailable = true): SkillInfo[] {
    const byName = new Map<string, SkillInfo>()
    for (const s of this.listInDir(this.workspaceSkillsDir, 'workspace'))
      byName.set(s.name, s)
    if (this.builtinSkillsDir) {
      for (const s of this.listInDir(this.builtinSkillsDir, 'builtin')) {
        if (!byName.has(s.name))
          byName.set(s.name, s)
      }
    }
    const all = Array.from(byName.values())
    if (filterUnavailable)
      return all.filter(s => this.check_requirements(this.get_skill_meta(s.name)))
    return all
  }

  loadSkill(name: string): string | null {
    const workspacePath = join(this.workspaceSkillsDir, name, 'SKILL.md')
    if (existsSync(workspacePath))
      return readFileSync(workspacePath, 'utf-8')
    if (this.builtinSkillsDir) {
      const builtinPath = join(this.builtinSkillsDir, name, 'SKILL.md')
      if (existsSync(builtinPath))
        return readFileSync(builtinPath, 'utf-8')
    }
    return null
  }

  get_skill_metadata(name: string): SkillMetadata | null {
    const content = this.loadSkill(name)
    if (!content || !content.startsWith('---'))
      return null
    const match = content.match(/^---\n(.*?)\n---/s)
    if (!match)
      return null
    const metadata: SkillMetadata = {}
    for (const line of match[1].split('\n')) {
      if (line.includes(':')) {
        const idx = line.indexOf(':')
        const key = line.slice(0, idx).trim()
        let value = line.slice(idx + 1).trim()
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\'')))
          value = value.slice(1, -1)
        if (key === 'always')
          metadata.always = value === 'true'
        else if (key === 'description')
          metadata.description = value
        else if (key === 'metadata')
          metadata.metadata = value
      }
    }
    return metadata
  }

  /** Parse nanobot JSON from frontmatter metadata field. */
  parseNanobotMetadata(raw: string): NanobotSkillMeta {
    try {
      const data = JSON.parse(raw) as Record<string, unknown>
      return (data?.nanobot as NanobotSkillMeta) ?? {}
    }
    catch {
      return {}
    }
  }

  strip_frontmatter(content: string): string {
    if (content.startsWith('---')) {
      const match = content.match(/^---\n.*?\n---\n/s)
      if (match)
        return content.slice(match[0].length).trim()
    }
    return content
  }

  get_skill_meta(name: string): NanobotSkillMeta {
    const meta = this.get_skill_metadata(name)
    if (!meta?.metadata)
      return {}
    return this.parseNanobotMetadata(meta.metadata)
  }

  check_requirements(skillMeta: NanobotSkillMeta): boolean {
    const requires = skillMeta.requires
    if (!requires)
      return true
    for (const b of requires.bins ?? []) {
      if (!whichSync(b))
        return false
    }
    for (const env of requires.env ?? []) {
      if (!process.env[env])
        return false
    }
    return true
  }

  getMissingRequirements(skillMeta: NanobotSkillMeta): string {
    const missing: string[] = []
    const requires = skillMeta.requires
    if (!requires)
      return ''
    for (const b of requires.bins ?? []) {
      if (!whichSync(b))
        missing.push(`CLI: ${b}`)
    }
    for (const env of requires.env ?? []) {
      if (!process.env[env])
        missing.push(`ENV: ${env}`)
    }
    return missing.join(', ')
  }

  private getSkillDescription(name: string): string {
    const meta = this.get_skill_metadata(name)
    if (meta?.description)
      return meta.description
    return name
  }

  buildSkillsSummary(): string {
    const all = this.listSkills(false)
    if (all.length === 0)
      return ''
    const lines = ['<skills>']
    for (const s of all) {
      const desc = this.getSkillDescription(s.name)
      const skillMeta = this.get_skill_meta(s.name)
      const available = this.check_requirements(skillMeta)
      lines.push(`  <skill available="${String(available).toLowerCase()}">`)
      lines.push(`    <name>${escapeXml(s.name)}</name>`)
      lines.push(`    <description>${escapeXml(desc)}</description>`)
      lines.push(`    <location>${s.path}</location>`)
      if (!available) {
        const missing = this.getMissingRequirements(skillMeta)
        if (missing)
          lines.push(`    <requires>${escapeXml(missing)}</requires>`)
      }
      lines.push('  </skill>')
    }
    lines.push('</skills>')
    return lines.join('\n')
  }

  get_always_skills(): string[] {
    const result: string[] = []
    for (const s of this.listSkills(true)) {
      const meta = this.get_skill_metadata(s.name)
      const skillMeta = this.get_skill_meta(s.name)
      if (skillMeta.always || meta?.always)
        result.push(s.name)
    }
    return result
  }

  load_skills_for_context(names: string[]): string {
    const parts: string[] = []
    for (const name of names) {
      const content = this.loadSkill(name)
      if (content) {
        const body = this.strip_frontmatter(content)
        parts.push(`### Skill: ${name}\n\n${body}`)
      }
    }
    return parts.length ? parts.join('\n\n---\n\n') : ''
  }
}
