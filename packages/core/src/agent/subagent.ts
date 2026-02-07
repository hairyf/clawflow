/**
 * Subagent manager: run task in background, announce result via bus.
 * @see sources/nanobot/nanobot/agent/subagent.py
 */

import type { InboundMessage } from '../bus/events.js'
import type { MessageBus } from '../bus/queue.js'
import type { LLMProvider } from '../providers/base.js'
import { listDirTool, readFileTool, writeFileTool } from './tools/filesystem.js'
import { ToolRegistry } from './tools/registry.js'
import { execTool } from './tools/shell.js'
import { webFetchTool, webSearchTool } from './tools/web.js'

export interface SubagentManagerOptions {
  provider: LLMProvider
  workspace: string
  bus: MessageBus
  model?: string
  braveApiKey?: string
  execTimeout?: number
  restrictToWorkspace?: boolean
}

export class SubagentManager {
  private provider: LLMProvider
  private workspace: string
  private bus: MessageBus
  private model: string
  private braveApiKey: string
  private execTimeout: number
  private restrictToWorkspace: boolean

  constructor(options: SubagentManagerOptions) {
    this.provider = options.provider
    this.workspace = options.workspace
    this.bus = options.bus
    this.model = options.model ?? options.provider.getDefaultModel()
    this.braveApiKey = options.braveApiKey ?? ''
    this.execTimeout = options.execTimeout ?? 60
    this.restrictToWorkspace = options.restrictToWorkspace ?? false
  }

  async spawn(
    task: string,
    label: string | undefined,
    originChannel: string,
    originChatId: string,
  ): Promise<string> {
    const taskId = Math.random().toString(36).slice(2, 10)
    const displayLabel = label ?? (task.length > 30 ? `${task.slice(0, 30)}...` : task)
    setImmediate(() => {
      this.runSubagent(taskId, task, displayLabel, originChannel, originChatId).catch(() => {})
    })
    return `Subagent [${displayLabel}] started (id: ${taskId}). I'll notify you when it completes.`
  }

  private async runSubagent(
    taskId: string,
    task: string,
    label: string,
    originChannel: string,
    originChatId: string,
  ): Promise<void> {
    const tools = new ToolRegistry()
    const allowedDir = this.restrictToWorkspace ? this.workspace : null
    tools.register(readFileTool(allowedDir))
    tools.register(writeFileTool(allowedDir))
    tools.register(listDirTool(allowedDir))
    tools.register(execTool({
      workingDir: this.workspace,
      timeout: this.execTimeout,
      restrictToWorkspace: this.restrictToWorkspace,
    }))
    tools.register(webSearchTool(this.braveApiKey || undefined))
    tools.register(webFetchTool())

    const systemPrompt = `# Subagent
You are a subagent. Complete this task only.
## Task
${task}
## Rules
Stay focused. Your final response will be reported to the main agent. No message tool, no spawn.
## Workspace
${this.workspace}`

    const messages: Array<Record<string, unknown>> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task },
    ]
    const maxIterations = 15
    let finalResult: string | null = null
    for (let i = 0; i < maxIterations; i++) {
      const res = await this.provider.chat({
        messages,
        tools: tools.getDefinitions(),
        model: this.model,
      })
      if (res.toolCalls.length > 0) {
        messages.push({
          role: 'assistant',
          content: res.content ?? '',
          tool_calls: res.toolCalls.map(tc => ({
            id: tc.id,
            type: 'function',
            function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
          })),
        })
        for (const tc of res.toolCalls) {
          const result = await tools.execute(tc.name, tc.arguments)
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            name: tc.name,
            content: result,
          })
        }
      }
      else {
        finalResult = res.content ?? 'Task completed but no response.'
        break
      }
    }
    if (finalResult === null)
      finalResult = 'Task completed but no final response.'
    const announceContent = `[Subagent '${label}' completed]

Task: ${task}

Result:
${finalResult}

Summarize this briefly for the user (1-2 sentences). Do not mention "subagent" or task IDs.`
    const msg: InboundMessage = {
      channel: 'system',
      senderId: 'subagent',
      chatId: `${originChannel}:${originChatId}`,
      content: announceContent,
    }
    await this.bus.publishInbound(msg)
  }
}
