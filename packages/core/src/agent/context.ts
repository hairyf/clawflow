/**
 * Context builder: system prompt + messages for LLM.
 * @see sources/nanobot/nanobot/agent/context.py
 */

import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import { extname } from 'node:path'
import { join } from 'pathe'
import { getRuntimeInfo } from '../utils/helpers'
import { MemoryStore } from './memory'
import { SkillsLoader } from './skills'

const BOOTSTRAP_FILES = ['AGENTS.md', 'SOUL.md', 'USER.md', 'TOOLS.md', 'IDENTITY.md']

/** User message content part for multimodal (image_url + text). */
export type UserContentPart
  = | { type: 'text', text: string }
    | { type: 'image_url', image_url: { url: string } }

/** MIME for image extensions (nanobot _build_user_content equivalent). */
const IMAGE_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
}

export class ContextBuilder {
  private workspace: string
  private memory: MemoryStore
  private skills: SkillsLoader

  constructor(workspace: string, skills?: SkillsLoader) {
    this.workspace = workspace
    this.memory = new MemoryStore(workspace)
    this.skills = skills ?? new SkillsLoader(workspace)
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
    // Progressive skills: 1) always-loaded skills full content
    const alwaysSkills = this.skills.getAlwaysSkills()
    if (alwaysSkills.length) {
      const alwaysContent = this.skills.loadSkillsForContext(alwaysSkills)
      if (alwaysContent)
        parts.push(`# Active Skills\n\n${alwaysContent}`)
    }
    // 2) Skills summary (agent uses read_file to load on demand)
    const skillsSummary = this.skills.buildSkillsSummary()
    if (skillsSummary) {
      parts.push(`# Skills

The following skills extend your capabilities. To use a skill, read its SKILL.md file using the read_file tool.
Skills with available="false" need dependencies installed first - you can try installing them with apt/brew.

${skillsSummary}`)
    }
    return parts.join('\n\n---\n\n')
  }

  buildMessages(options: {
    history: Array<{ role: string, content: string }>
    currentMessage: string
    channel?: string
    chatId?: string
    /** Optional local file paths for images (built like nanobot _build_user_content). */
    media?: string[]
  }): Array<{ role: string, content: string | UserContentPart[] }> {
    const system = this.buildSystemPrompt()
    const sessionNote = (options.channel && options.chatId)
      ? `\n\n## Current Session\nChannel: ${options.channel}\nChat ID: ${options.chatId}`
      : ''
    const userContent = this.buildUserContent(options.currentMessage, options.media)
    const messages: Array<{ role: string, content: string | UserContentPart[] }> = [
      { role: 'system', content: system + sessionNote },
      ...options.history,
      { role: 'user', content: userContent },
    ]
    return messages
  }

  /**
   * Build user message content with optional base64-encoded images (nanobot _build_user_content).
   * Returns plain text if no media or no valid image paths; otherwise image_url parts + text.
   */
  buildUserContent(text: string, media?: string[]): string | UserContentPart[] {
    if (!media?.length)
      return text
    const images: UserContentPart[] = []
    for (const path of media) {
      const mime = IMAGE_MIME[extname(path).toLowerCase()]
      if (!mime || !existsSync(path))
        continue
      try {
        const buf = readFileSync(path)
        const b64 = Buffer.from(buf).toString('base64')
        images.push({ type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } })
      }
      catch {
        /* skip failed reads */
      }
    }
    if (images.length === 0)
      return text
    return [...images, { type: 'text', text }]
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
