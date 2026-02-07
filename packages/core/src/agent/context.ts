/**
 * Context builder: system prompt + messages for LLM.
 * @see sources/nanobot/nanobot/agent/context.py
 */

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'
import { getRuntimeInfo } from '../utils/helpers.js'
import { MemoryStore } from './memory.js'
import { SkillsLoader } from './skills.js'

const BOOTSTRAP_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'IDENTITY.md']

export class ContextBuilder {
  private workspace: string
  private memory: MemoryStore
  private skills: SkillsLoader

  constructor(workspace: string) {
    this.workspace = workspace
    this.memory = new MemoryStore(workspace)
    this.skills = new SkillsLoader(workspace)
  }

  buildSystemPrompt(_skillNames?: string[]): string {
    const parts: string[] = []
    const now = new Date().toLocaleString('en-CA', { weekday: 'long' })
    const runtime = getRuntimeInfo()
    parts.push(`# ClawFlow

You are ClawFlow, a helpful AI assistant. You have access to tools to:
- Read, write, and edit files
- Execute shell commands
- Search the web and fetch pages
- Send messages to users on chat channels
- Spawn subagents for background tasks

## Current Time
${new Date().toISOString().slice(0, 19)} (${now})

## Runtime
${runtime}

## Workspace
${this.workspace}
- Memory: ${join(this.workspace, 'memory', 'MEMORY.md')}
- Daily notes: ${join(this.workspace, 'memory', 'YYYY-MM-DD.md')}
- Skills: ${join(this.workspace, 'skills', '{name}', 'SKILL.md')}

Reply directly with text for normal conversation. Use the message tool only when sending to a specific chat channel.`)

    for (const name of BOOTSTRAP_FILES) {
      const path = join(this.workspace, name)
      if (existsSync(path))
        parts.push(`## ${name}\n\n${readFileSync(path, 'utf-8')}`)
    }
    const mem = this.memory.getMemoryContext()
    if (mem)
      parts.push(`# Memory\n\n${mem}`)
    const skillsSummary = this.skills.buildSkillsSummary()
    if (skillsSummary)
      parts.push(`# Skills\n\n${skillsSummary}`)
    return parts.join('\n\n---\n\n')
  }

  buildMessages(options: {
    history: Array<{ role: string, content: string }>
    currentMessage: string
    channel?: string
    chatId?: string
  }): Array<{ role: string, content: string }> {
    const system = this.buildSystemPrompt()
    const sessionNote = (options.channel && options.chatId)
      ? `\n\n## Current Session\nChannel: ${options.channel}\nChat ID: ${options.chatId}`
      : ''
    const messages: Array<{ role: string, content: string }> = [
      { role: 'system', content: system + sessionNote },
      ...options.history,
      { role: 'user', content: options.currentMessage },
    ]
    return messages
  }

  addAssistantMessage(
    messages: Array<Record<string, unknown>>,
    content: string | null,
    toolCalls?: Array<{ id: string, name: string, arguments: Record<string, unknown> }>,
  ): void {
    const msg: Record<string, unknown> = { role: 'assistant', content: content ?? '' }
    if (toolCalls?.length) {
      msg.tool_calls = toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
      }))
    }
    messages.push(msg)
  }

  addToolResult(
    messages: Array<Record<string, unknown>>,
    toolCallId: string,
    toolName: string,
    result: string,
  ): void {
    messages.push({
      role: 'tool',
      tool_call_id: toolCallId,
      name: toolName,
      content: result,
    })
  }
}
