/**
 * Tool registry: register, get definitions, execute by name.
 * @see sources/nanobot/nanobot/agent/tools/registry.py
 */

import type { Tool, ToolDefinition } from './base'

export class ToolRegistry {
  private tools = new Map<string, Tool>()

  register(tool: Tool): void {
    this.tools.set(tool.name, tool)
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name)
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
    try {
      return await tool.execute(params)
    }
    catch (e) {
      return `Error executing ${name}: ${e}`
    }
  }
}
