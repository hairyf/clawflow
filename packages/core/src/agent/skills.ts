/**
 * Skills loader: list/load SKILL.md from workspace/skills.
 * @see sources/nanobot/nanobot/agent/skills.py
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'pathe'

export interface SkillInfo {
  name: string
  path: string
  source: 'workspace' | 'builtin'
}

export class SkillsLoader {
  private workspaceSkillsDir: string

  constructor(workspace: string) {
    this.workspaceSkillsDir = join(workspace, 'skills')
  }

  listSkills(): SkillInfo[] {
    const skills: SkillInfo[] = []
    if (existsSync(this.workspaceSkillsDir)) {
      for (const name of readdirSync(this.workspaceSkillsDir)) {
        const skillPath = join(this.workspaceSkillsDir, name, 'SKILL.md')
        if (existsSync(skillPath))
          skills.push({ name, path: skillPath, source: 'workspace' })
      }
    }
    return skills
  }

  loadSkill(name: string): string | null {
    const path = join(this.workspaceSkillsDir, name, 'SKILL.md')
    if (existsSync(path))
      return readFileSync(path, 'utf-8')
    return null
  }

  buildSkillsSummary(): string {
    const all = this.listSkills()
    if (all.length === 0)
      return ''
    const lines = ['<skills>']
    for (const s of all) {
      const desc = s.name
      lines.push(`  <skill available="true">`)
      lines.push(`    <name>${escapeXml(s.name)}</name>`)
      lines.push(`    <description>${escapeXml(desc)}</description>`)
      lines.push(`    <location>${s.path}</location>`)
      lines.push(`  </skill>`)
    }
    lines.push('</skills>')
    return lines.join('\n')
  }

  getAlwaysSkills(): string[] {
    return []
  }

  loadSkillsForContext(_names: string[]): string {
    return ''
  }
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
