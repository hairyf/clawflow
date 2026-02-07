/**
 * File tools: read_file, write_file, edit_file, list_dir.
 * @see sources/nanobot/nanobot/agent/tools/filesystem.py
 */

import type { Tool } from './base'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'pathe'

function resolvePath(path: string, allowedDir?: string | null): string {
  const resolved = resolve(path)
  if (allowedDir && !resolved.startsWith(resolve(allowedDir)))
    throw new Error(`Path ${path} is outside allowed directory ${allowedDir}`)
  return resolved
}

function createFileTool(allowedDir: string | null): Tool {
  return {
    name: 'read_file',
    description: 'Read the contents of a file at the given path.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'The file path to read' } },
      required: ['path'],
    },
    async execute({ path }: Record<string, unknown>) {
      try {
        const p = resolvePath(String(path), allowedDir)
        if (!existsSync(p))
          return `Error: File not found: ${path}`
        return readFileSync(p, 'utf-8')
      }
      catch (e: any) {
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}

function createWriteFileTool(allowedDir: string | null): Tool {
  return {
    name: 'write_file',
    description: 'Write content to a file. Creates parent directories if needed.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'The file path to write to' },
        content: { type: 'string', description: 'The content to write' },
      },
      required: ['path', 'content'],
    },
    async execute({ path, content }: Record<string, unknown>) {
      try {
        const p = resolvePath(String(path), allowedDir)
        mkdirSync(dirname(p), { recursive: true })
        writeFileSync(p, String(content), 'utf-8')
        return `Successfully wrote ${String(content).length} bytes to ${path}`
      }
      catch (e: any) {
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}

function createEditFileTool(allowedDir: string | null): Tool {
  return {
    name: 'edit_file',
    description: 'Edit a file by replacing old_text with new_text. The old_text must exist exactly.',
    parameters: {
      type: 'object',
      properties: {
        path: { type: 'string' },
        old_text: { type: 'string' },
        new_text: { type: 'string' },
      },
      required: ['path', 'old_text', 'new_text'],
    },
    async execute({ path, old_text, new_text }: Record<string, unknown>) {
      try {
        const p = resolvePath(String(path), allowedDir)
        if (!existsSync(p))
          return `Error: File not found: ${path}`
        const content = readFileSync(p, 'utf-8')
        const old = String(old_text)
        if (!content.includes(old))
          return 'Error: old_text not found in file. Make sure it matches exactly.'
        const count = (content.match(new RegExp(escapeRe(old), 'g')) ?? []).length
        if (count > 1)
          return `Warning: old_text appears ${count} times. Please provide more context to make it unique.`
        writeFileSync(p, content.replace(old, String(new_text)), 'utf-8')
        return `Successfully edited ${path}`
      }
      catch (e: any) {
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function createListDirTool(allowedDir: string | null): Tool {
  return {
    name: 'list_dir',
    description: 'List the contents of a directory.',
    parameters: {
      type: 'object',
      properties: { path: { type: 'string', description: 'The directory path to list' } },
      required: ['path'],
    },
    async execute({ path }: Record<string, unknown>) {
      try {
        const p = resolvePath(String(path), allowedDir)
        if (!existsSync(p))
          return `Error: Directory not found: ${path}`
        const names = readdirSync(p)
        const entries = names.map((n) => {
          const full = `${p}/${n}`
          const isDir = existsSync(full) && statSync(full).isDirectory()
          return (isDir ? '📁 ' : '📄 ') + n
        }).sort()
        return entries.length ? entries.join('\n') : `Directory ${path} is empty`
      }
      catch (e: any) {
        return `Error: ${e?.message ?? e}`
      }
    },
  }
}

export function readFileTool(allowedDir?: string | null): Tool {
  return createFileTool(allowedDir ?? null)
}

export function writeFileTool(allowedDir?: string | null): Tool {
  return createWriteFileTool(allowedDir ?? null)
}

export function editFileTool(allowedDir?: string | null): Tool {
  return createEditFileTool(allowedDir ?? null)
}

export function listDirTool(allowedDir?: string | null): Tool {
  return createListDirTool(allowedDir ?? null)
}
