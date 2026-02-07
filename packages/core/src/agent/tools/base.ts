/**
 * Base tool interface (OpenAI function schema + execute).
 * @see sources/nanobot/nanobot/agent/tools/base.py
 */

export interface ToolParameterSchema {
  type: string
  properties?: Record<string, unknown>
  required?: string[]
  [key: string]: unknown
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: ToolParameterSchema
  }
}

export interface Tool {
  readonly name: string
  readonly description: string
  readonly parameters: ToolParameterSchema
  execute: (args: Record<string, unknown>) => Promise<string>
}

export function toolToSchema(tool: Tool): ToolDefinition {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    },
  }
}
