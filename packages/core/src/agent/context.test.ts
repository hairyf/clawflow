import type { SkillsLoader } from './skills'
/**
 * 单元测试：验证 skills 是否被正确写进发给 AI 的 system prompt。
 * 对应 spec: .bonfire/specs/skills-module-verification.md
 */
import { describe, expect, it, vi } from 'vitest'
import { ContextBuilder } from './context'

function mockSkillsLoader(overrides: {
  getAlwaysSkills?: () => string[]
  loadSkillsForContext?: (names: string[]) => string
  buildSkillsSummary?: () => string
}): SkillsLoader {
  return {
    getAlwaysSkills: overrides.getAlwaysSkills ?? vi.fn(() => []),
    loadSkillsForContext: overrides.loadSkillsForContext ?? vi.fn(() => ''),
    buildSkillsSummary: overrides.buildSkillsSummary ?? vi.fn(() => ''),
  } as unknown as SkillsLoader
}

describe('contextBuilder: skills 传入 system prompt', () => {
  const workspace = '/tmp/test-workspace'

  it('当有 always skills 时，system prompt 包含 # Active Skills 及技能全文', () => {
    const alwaysBody = 'Use this skill to run cron jobs.'
    const mockSkills = mockSkillsLoader({
      getAlwaysSkills: () => ['cron'],
      loadSkillsForContext: (names: string[]) =>
        names.length
          ? `### Skill: ${names[0]}\n\n${alwaysBody}`
          : '',
      buildSkillsSummary: () => '',
    })
    const ctx = new ContextBuilder(workspace, mockSkills)
    const system = ctx.buildSystemPrompt()

    expect(system).toContain('# Active Skills')
    expect(system).toContain('### Skill: cron')
    expect(system).toContain(alwaysBody)
  })

  it('当有 skills summary 时，system prompt 包含 # Skills 及 <skills> 摘要', () => {
    const summary = '<skills>\n  <skill available="true">\n    <name>cron</name>\n    <description>Cron</description>\n    <location>/path/cron/SKILL.md</location>\n  </skill>\n</skills>'
    const mockSkills = mockSkillsLoader({
      getAlwaysSkills: () => [],
      loadSkillsForContext: () => '',
      buildSkillsSummary: () => summary,
    })
    const ctx = new ContextBuilder(workspace, mockSkills)
    const system = ctx.buildSystemPrompt()

    expect(system).toContain('# Skills')
    expect(system).toContain('<skills>')
    expect(system).toContain('</skills>')
    expect(system).toContain('<name>cron</name>')
    expect(system).toContain('read its SKILL.md file using the read_file tool')
  })

  it('buildMessages 的第一条消息的 content 即为含 skills 的 system prompt', () => {
    const summary = '<skills><skill available="true"><name>test</name></skill></skills>'
    const mockSkills = mockSkillsLoader({
      getAlwaysSkills: () => ['test'],
      loadSkillsForContext: () => '### Skill: test\n\nTest body',
      buildSkillsSummary: () => summary,
    })
    const ctx = new ContextBuilder(workspace, mockSkills)
    const messages = ctx.buildMessages({
      history: [],
      currentMessage: 'hello',
    })

    expect(messages.length).toBeGreaterThanOrEqual(2)
    expect(messages[0].role).toBe('system')
    const systemContent = messages[0].content as string
    expect(systemContent).toContain('# Active Skills')
    expect(systemContent).toContain('### Skill: test')
    expect(systemContent).toContain('# Skills')
    expect(systemContent).toContain('<skills>')
  })
})
