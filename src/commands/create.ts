import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { generateOpenClawJson } from '../openclaw/generate-json.js'

const COLLECTIVE_SUBDIRS = ['swarm', 'hive-mind', 'coordination'] as const
const SRC_SUBDIRS = ['skills', 'tools'] as const

function mkdirp(dir: string): void {
  if (!fs.existsSync(dir))
    fs.mkdirSync(dir, { recursive: true })
}

function writeIfMissing(filePath: string, content: string): void {
  if (fs.existsSync(filePath))
    return
  mkdirp(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
}

/**
 * 创建项目脚手架：.openclaw、.collective、agents、skills、src、package.json。
 * 配置由 OpenClaw 接管（.openclaw/openclaw.json），不再使用 clawflow.config。
 */
export async function runCreate(projectName: string, cwd: string = process.cwd()): Promise<void> {
  const targetDir = path.resolve(cwd, projectName)
  if (fs.existsSync(targetDir)) {
    const stat = fs.statSync(targetDir)
    if (!stat.isDirectory())
      throw new Error(`已存在同名文件: ${targetDir}`)
    const hasContent = fs.readdirSync(targetDir).length > 0
    if (hasContent)
      throw new Error(`目录非空: ${targetDir}，请换名或使用空目录`)
  }

  mkdirp(targetDir)

  mkdirp(path.join(targetDir, '.openclaw'))
  for (const sub of COLLECTIVE_SUBDIRS)
    mkdirp(path.join(targetDir, '.collective', sub))
  mkdirp(path.join(targetDir, 'agents'))
  mkdirp(path.join(targetDir, 'skills'))
  mkdirp(path.join(targetDir, 'src'))
  for (const sub of SRC_SUBDIRS)
    mkdirp(path.join(targetDir, 'src', sub))

  writeIfMissing(
    path.join(targetDir, 'src', 'AGENTS.md'),
    '# Agent Skills\n\n项目级 Agent 技能与约定（由 OpenClaw 注入）。\n',
  )
  writeIfMissing(
    path.join(targetDir, 'src', 'SOUL.md'),
    '# Soul / 人格\n\n可选：Agent 人格与风格说明。\n',
  )
  writeIfMissing(
    path.join(targetDir, 'src', 'TOOLS.md'),
    '# Tools\n\n可选：工具使用说明（由 OpenClaw 注入）。\n',
  )

  const pkgPath = path.join(targetDir, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    const pkg = {
      name: projectName.replace(/^@[^/]+\//, '').replace(/[^a-z0-9-]/gi, '-').toLowerCase() || 'clawflow-project',
      version: '0.0.0',
      private: true,
      clawflow: true,
    }
    fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')
  }

  const srcDir = path.join(targetDir, 'src')
  generateOpenClawJson(targetDir, srcDir)
}
