/**
 * Agent loop: consume inbound, build context, call LLM, run tools, publish outbound.
 * @see sources/nanobot/nanobot/agent/loop.py
 */

import type { InboundMessage, OutboundMessage } from '../bus/events'
import type { MessageBus } from '../bus/queue'
import type { CronService } from '../cron/service'
import type { ChatMessage, LLMProvider, ToolCallRequest } from '../providers/base'
import type { SubagentManager } from './subagent'
import { get_session_key } from '../bus/events'
import { hasToolCalls } from '../providers/base'
import { SessionManager } from '../session/manager'

import { parse_session_key } from '../utils/helpers'
import { ContextBuilder } from './context'
import { cronTool } from './tools/cron'
import { editFileTool, listDirTool, readFileTool, writeFileTool } from './tools/filesystem'
import { messageTool } from './tools/message'
import { ToolRegistry } from './tools/registry'
import { execTool } from './tools/shell'
import { spawnTool } from './tools/spawn'
import { webFetchTool, webSearchTool } from './tools/web'

export interface AgentLoopOptions {
  bus: MessageBus
  provider: LLMProvider
  workspace: string
  model?: string
  maxIterations?: number
  braveApiKey?: string
  exec_timeout?: number
  restrictToWorkspace?: boolean
  cronService?: CronService | null
  subagentManager?: SubagentManager
}

export class AgentLoop {
  private bus: MessageBus
  private provider: LLMProvider
  private workspace: string
  private model: string
  private maxIterations: number
  private braveApiKey: string
  private exec_timeout: number
  private restrictToWorkspace: boolean
  private cronService: CronService | null
  private subagentManager: SubagentManager | null
  private context: ContextBuilder
  private sessions: SessionManager
  private tools: ToolRegistry
  private running = false

  constructor(options: AgentLoopOptions) {
    this.bus = options.bus
    this.provider = options.provider
    this.workspace = options.workspace
    this.model = options.model ?? options.provider.getDefaultModel()
    this.maxIterations = options.maxIterations ?? 20
    this.braveApiKey = options.braveApiKey ?? ''
    this.exec_timeout = options.exec_timeout ?? 60
    this.restrictToWorkspace = options.restrictToWorkspace ?? false
    this.cronService = options.cronService ?? null
    this.subagentManager = options.subagentManager ?? null
    this.context = new ContextBuilder(options.workspace)
    this.sessions = new SessionManager(options.workspace)
    this.tools = new ToolRegistry()

    const allowed_dir = this.restrictToWorkspace ? this.workspace : null
    this.tools.register(readFileTool(allowed_dir))
    this.tools.register(writeFileTool(allowed_dir))
    this.tools.register(editFileTool(allowed_dir))
    this.tools.register(listDirTool(allowed_dir))
    this.tools.register(execTool({
      workingDir: this.workspace,
      timeout: this.exec_timeout,
      restrictToWorkspace: this.restrictToWorkspace,
    }))
    this.tools.register(webSearchTool(this.braveApiKey || undefined))
    this.tools.register(webFetchTool())
    const msgTool = messageTool(m => this.bus.publishOutbound(m))
    this.tools.register(msgTool)
    if (this.subagentManager) {
      const spawn = spawnTool(this.subagentManager)
      this.tools.register(spawn)
    }
    if (this.cronService)
      this.tools.register(cronTool(this.cronService))
  }

  async run(): Promise<void> {
    this.running = true
    while (this.running) {
      try {
        const msg = await Promise.race([
          this.bus.consumeInbound(),
          new Promise<InboundMessage>((_, rej) => setTimeout(() => rej(new Error('timeout')), 1000)),
        ])
        try {
          const response = await this.processMessage(msg)
          if (response)
            await this.bus.publishOutbound(response)
        }
        catch (e: any) {
          await this.bus.publishOutbound({
            channel: msg.channel,
            chat_id: msg.chat_id,
            content: `Sorry, I encountered an error: ${e?.message ?? e}`,
          })
        }
      }
      catch {
        // timeout
      }
    }
  }

  stop(): void {
    this.running = false
  }

  async processDirect(
    content: string,
    _sessionKey = 'cli:direct',
    channel = 'cli',
    chat_id = 'direct',
  ): Promise<string> {
    const msg: InboundMessage = { channel, sender_id: 'user', chat_id, content }
    const out = await this.processMessage(msg)
    return out?.content ?? ''
  }

  private setToolContext(channel: string, chat_id: string): void {
    const msgTool = this.tools.get('message') as ReturnType<typeof messageTool> | undefined
    msgTool?.set_context?.(channel, chat_id)
    const spawn = this.tools.get('spawn') as ReturnType<typeof spawnTool> | undefined
    spawn?.set_context?.(channel, chat_id)
    const cron = this.tools.get('cron') as ReturnType<typeof cronTool> | undefined
    cron?.set_context?.(channel, chat_id)
  }

  private async processMessage(msg: InboundMessage): Promise<OutboundMessage | null> {
    if (msg.channel === 'system') {
      let originChannel: string
      let originChatId: string
      if (msg.chat_id.includes(':')) {
        try {
          [originChannel, originChatId] = parse_session_key(msg.chat_id)
        }
        catch {
          originChannel = 'cli'
          originChatId = msg.chat_id
        }
      }
      else {
        originChannel = 'cli'
        originChatId = msg.chat_id
      }
      return this.processSystemMessage(msg, originChannel, originChatId)
    }
    const session = this.sessions.get_or_create(get_session_key(msg))
    this.setToolContext(msg.channel, msg.chat_id)
    const history = this.sessions.getHistory(session)
    const messages = this.context.build_messages({
      history,
      currentMessage: msg.content,
      channel: msg.channel,
      chat_id: msg.chat_id,
      media: msg.media ?? undefined,
    })
    const messagesMutable: Array<Record<string, unknown>> = messages.map(m => ({ ...m }))
    let finalContent: string | null = null
    for (let iter = 0; iter < this.maxIterations; iter++) {
      const res = await this.provider.chat({
        messages: messagesMutable as unknown as ChatMessage[],
        tools: this.tools.getDefinitions(),
        model: this.model,
        executeTool: (name, args) => this.tools.execute(name, args),
        maxIterations: this.maxIterations,
      })
      if (hasToolCalls(res)) {
        this.context.addAssistantMessage(
          messagesMutable,
          res.content,
          res.toolCalls.map((tc: ToolCallRequest) => ({ id: tc.id, name: tc.name, arguments: tc.arguments })),
        )
        for (const tc of res.toolCalls) {
          const result = await this.tools.execute(tc.name, tc.arguments)
          this.context.addToolResult(messagesMutable, tc.id, tc.name, result)
        }
      }
      else {
        finalContent = res.content ?? 'I\'ve completed but have no response.'
        break
      }
    }
    if (finalContent === null)
      finalContent = 'I\'ve completed processing but have no response.'
    this.sessions.add_message(session, 'user', msg.content)
    this.sessions.add_message(session, 'assistant', finalContent)
    this.sessions.save(session)
    return { channel: msg.channel, chat_id: msg.chat_id, content: finalContent }
  }

  private async processSystemMessage(
    msg: InboundMessage,
    originChannel: string,
    originChatId: string,
  ): Promise<OutboundMessage | null> {
    const session = this.sessions.get_or_create(`${originChannel}:${originChatId}`)
    this.setToolContext(originChannel, originChatId)
    const history = this.sessions.getHistory(session)
    const messages = this.context.build_messages({
      history,
      currentMessage: msg.content,
      channel: originChannel,
      chat_id: originChatId,
      media: msg.media ?? undefined,
    })
    const messagesMutable: Array<Record<string, unknown>> = messages.map(m => ({ ...m }))
    let finalContent: string | null = null
    for (let iter = 0; iter < this.maxIterations; iter++) {
      const res = await this.provider.chat({
        messages: messagesMutable as unknown as ChatMessage[],
        tools: this.tools.getDefinitions(),
        model: this.model,
        executeTool: (name, args) => this.tools.execute(name, args),
        maxIterations: this.maxIterations,
      })
      if (hasToolCalls(res)) {
        this.context.addAssistantMessage(
          messagesMutable,
          res.content,
          res.toolCalls.map((tc: ToolCallRequest) => ({ id: tc.id, name: tc.name, arguments: tc.arguments })),
        )
        for (const tc of res.toolCalls) {
          const result = await this.tools.execute(tc.name, tc.arguments)
          this.context.addToolResult(messagesMutable, tc.id, tc.name, result)
        }
      }
      else {
        finalContent = res.content ?? 'Background task completed.'
        break
      }
    }
    if (finalContent === null)
      finalContent = 'Background task completed.'
    this.sessions.add_message(session, 'user', `[System: ${msg.sender_id}] ${msg.content}`)
    this.sessions.add_message(session, 'assistant', finalContent)
    this.sessions.save(session)
    return { channel: originChannel, chat_id: originChatId, content: finalContent }
  }
}
