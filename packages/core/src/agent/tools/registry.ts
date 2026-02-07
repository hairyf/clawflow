/**
 * Tool registry: register, get definitions, execute by name.
 * @see sources/nanobot/nanobot/agent/tools/registry.py
 */

import type { Tool, ToolDefinition } from './base'
import { validateToolParams } from './base'

export class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  unregister(name: string): void {
    this.tools.delete(name)
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
  }

  has(name: string): boolean {
    return this.tools.has(name)
  }

  /** List of registered tool names. */
  get toolNames(): string[] {
    return Array.from(this.tools.keys())
  }

  getDefinitions(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(t => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }))
  }

  async execute(name: string, params: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name)
    if (!tool)
      return `Error: Tool '${name}' not found`
    const errors = tool.validateParams
      ? tool.validateParams(params)
      : validateToolParams(tool.parameters, params)
    if (errors.length > 0)
      return `Error: Invalid parameters for tool '${name}': ${errors.join('; ')}`
    try {
      return await tool.execute(params)
    }
    catch (e) {
      return `Error executing ${name}: ${e}`
    }
  }
}
