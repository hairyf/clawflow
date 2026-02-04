import process from 'node:process'
import { Command } from 'commander'
import { runCreate } from '../commands/create.js'
import { runOpenClaw } from '../commands/delegate.js'
import { loadConfig } from '../config/load.js'

const program = new Command()

program
  .name('clawflow')
  .description('工程化、项目绑定的 AI 工作流与多 Agent 编排（基于 OpenClaw）')
  .version('0.0.0')

program
  .command('create <project-name>')
  .description('创建项目脚手架（含 .openclaw、src 等，配置由 OpenClaw 接管）')
  .action(async (projectName: string) => {
    try {
      await runCreate(projectName)
      console.log(`已创建项目: ${projectName}/`)
      console.log('  - 进入目录后执行 clawflow gateway start 或 clawflow tui 使用 OpenClaw。')
    }
    catch (e) {
      console.error((e as Error).message)
      process.exit(1)
    }
  })

program
  .command('gateway')
  .description('OpenClaw Gateway：start | status | stop | restart')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['gateway', ...args])
    process.exit(code)
  })

program.command('tui')
  .description('委托 openclaw tui')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['tui', ...args])
    process.exit(code)
  })

program.command('status')
  .description('委托 openclaw status')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['status', ...args])
    process.exit(code)
  })

program.command('health')
  .description('委托 openclaw health')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['health', ...args])
    process.exit(code)
  })

program.command('doctor')
  .description('委托 openclaw doctor')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['doctor', ...args])
    process.exit(code)
  })

program.command('channels')
  .description('委托 openclaw channels')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['channels', ...args])
    process.exit(code)
  })

program.command('pairing')
  .description('委托 openclaw pairing')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['pairing', ...args])
    process.exit(code)
  })

program.command('cron')
  .description('委托 openclaw cron')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['cron', ...args])
    process.exit(code)
  })

program.command('sessions')
  .description('委托 openclaw sessions')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['sessions', ...args])
    process.exit(code)
  })

program.command('sandbox')
  .description('委托 openclaw sandbox')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['sandbox', ...args])
    process.exit(code)
  })

program.command('models')
  .description('委托 openclaw models')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['models', ...args])
    process.exit(code)
  })

program.command('nodes')
  .description('委托 openclaw nodes')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['nodes', ...args])
    process.exit(code)
  })

program.command('browser')
  .description('委托 openclaw browser')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['browser', ...args])
    process.exit(code)
  })

program.command('openclaw')
  .description('透传至 openclaw（例: clawflow openclaw -- gateway start）')
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('未在项目目录中。')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, args)
    process.exit(code)
  })

program.parseAsync().catch((e: Error) => {
  console.error(e.message)
  process.exit(1)
})
