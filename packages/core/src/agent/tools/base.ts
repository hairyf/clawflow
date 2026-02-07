/**
 * Base tool interface (OpenAI function schema + execute).
 * @see sources/nanobot/nanobot/agent/tools/base.py
 */

export interface ToolParameterSchema {
  type: string
  properties?: Record<string, ToolParameterSchema>
  required?: string[]
  enum?: unknown[]
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  items?: ToolParameterSchema
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
  /** Optional: validate params against JSON Schema. If absent, registry uses validateToolParams(parameters, params). */
  validateParams?: (params: Record<string, unknown>) => string[]
  execute: (args: Record<string, unknown>) => Promise<string>
}

/** Type checks for JSON Schema validation (nanobot _TYPE_MAP equivalent). */
const TYPE_CHECKS: Record<string, (v: unknown) => boolean> = {
  string: (v): v is string => typeof v === 'string',
  integer: v => typeof v === 'number' && Number.isInteger(v),
  number: v => typeof v === 'number',
  boolean: v => typeof v === 'boolean',
  array: v => Array.isArray(v),
  object: v => typeof v === 'object' && v !== null && !Array.isArray(v),
}

/**
 * Validate a value against a JSON Schema node. Returns list of error messages; empty if valid.
 * @see sources/nanobot/nanobot/agent/tools/base.py _validate
 */
function validateValue(schema: ToolParameterSchema, value: unknown, path: string): string[] {
  const type = (schema.type as string) ?? 'object'
  const label = path || 'parameter'

  if (type === 'object') {
    const obj = value as Record<string, unknown>
    const errors: string[] = []
    const props = (schema.properties ?? {}) as Record<string, ToolParameterSchema>
    const required = (schema.required ?? []) as string[]
    for (const k of required) {
      if (!(k in obj)) {
        errors.push(`missing required ${path ? `${path}.${k}` : k}`)
      }
    }
    for (const [k, v] of Object.entries(obj)) {
      if (k in props) {
        errors.push(...validateValue(props[k], v, path ? `${path}.${k}` : k))
      }
    }
    return errors
  }

  const check = TYPE_CHECKS[type]
  if (check && !check(value)) {
    return [`${label} should be ${type}`]
  }

  const errors: string[] = []
  if (Array.isArray(schema.enum) && !schema.enum.includes(value)) {
    errors.push(`${label} must be one of ${JSON.stringify(schema.enum)}`)
  }
  if (type === 'integer' || type === 'number') {
    const n = value as number
    if (typeof schema.minimum === 'number' && n < schema.minimum) {
      errors.push(`${label} must be >= ${schema.minimum}`)
    }
    if (typeof schema.maximum === 'number' && n > schema.maximum) {
      errors.push(`${label} must be <= ${schema.maximum}`)
    }
  }
  if (type === 'string') {
    const s = value as string
    if (typeof schema.minLength === 'number' && s.length < schema.minLength) {
      errors.push(`${label} must be at least ${schema.minLength} chars`)
    }
    if (typeof schema.maxLength === 'number' && s.length > schema.maxLength) {
      errors.push(`${label} must be at most ${schema.maxLength} chars`)
    }
  }
  if (type === 'array' && schema.items) {
    const arr = value as unknown[]
    const itemSchema = schema.items as ToolParameterSchema
    for (let i = 0; i < arr.length; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`
      errors.push(...validateValue(itemSchema, arr[i], itemPath))
    }
  }
  return errors
}

/**
 * Validate top-level tool params against schema (schema.type should be object).
 * Use from registry when tool has no validateParams.
 */
export function validateToolParams(schema: ToolParameterSchema, params: Record<string, unknown>): string[] {
  const root = { ...schema, type: 'object' } as ToolParameterSchema
  return validateValue(root, params, '')
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
