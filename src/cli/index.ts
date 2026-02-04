import process from 'node:process'
import { Command } from 'commander'
import { runCreate } from '../commands/create.js'
import { runOpenClaw } from '../commands/delegate.js'
import { loadConfig } from '../config/load.js'

const program = new Command()

program
  .name('clawflow')
  .description('Project-bound AI workflows and multi-agent orchestration (based on OpenClaw)')
  .version('0.0.0')

program
  .command('create <project-name>')
  .description('Create project scaffold (.openclaw, src, etc.; config managed by OpenClaw)')
  .action(async (projectName: string) => {
    try {
      await runCreate(projectName)
      console.log(`Project created: ${projectName}/`)
      console.log('  - Run clawflow gateway start or clawflow tui from that directory to use OpenClaw.')
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
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['gateway', ...args])
    process.exit(code)
  })

program.command('tui')
  .description('Delegate to openclaw tui')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['tui', ...args])
    process.exit(code)
  })

program.command('status')
  .description('Delegate to openclaw status')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['status', ...args])
    process.exit(code)
  })

program.command('health')
  .description('Delegate to openclaw health')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['health', ...args])
    process.exit(code)
  })

program.command('doctor')
  .description('Delegate to openclaw doctor')
  .argument('[args...]')
  .allowUnknownOption(true)
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['doctor', ...args])
    process.exit(code)
  })

program.command('channels')
  .description('Delegate to openclaw channels')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['channels', ...args])
    process.exit(code)
  })

program.command('pairing')
  .description('Delegate to openclaw pairing')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['pairing', ...args])
    process.exit(code)
  })

program.command('cron')
  .description('Delegate to openclaw cron')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['cron', ...args])
    process.exit(code)
  })

program.command('sessions')
  .description('Delegate to openclaw sessions')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['sessions', ...args])
    process.exit(code)
  })

program.command('sandbox')
  .description('Delegate to openclaw sandbox')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['sandbox', ...args])
    process.exit(code)
  })

program.command('models')
  .description('Delegate to openclaw models')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['models', ...args])
    process.exit(code)
  })

program.command('nodes')
  .description('Delegate to openclaw nodes')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['nodes', ...args])
    process.exit(code)
  })

program.command('browser')
  .description('Delegate to openclaw browser')
  .allowUnknownOption(true)
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, ['browser', ...args])
    process.exit(code)
  })

program.command('openclaw')
  .description('Pass-through to openclaw (e.g. clawflow openclaw -- gateway start)')
  .argument('[args...]')
  .action(async (args: string[]) => {
    const resolved = await loadConfig()
    if (!resolved) {
      console.error('Not in a project directory.')
      process.exit(1)
    }
    const code = await runOpenClaw(resolved, args)
    process.exit(code)
  })

program.parseAsync().catch((e: Error) => {
  console.error(e.message)
  process.exit(1)
})
