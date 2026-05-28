#!/usr/bin/env node
import { Command } from 'commander'
import { initCommand } from './commands/init.js'
import { runCommand } from './commands/run.js'
import { publishCommand } from './commands/publish.js'
import { generateCommand } from './commands/generate.js'
import { doctorCommand } from './commands/doctor.js'
import { configCommand } from './commands/config.js'

const program = new Command()

program
  .name('yapi-flow')
  .description('YApi Flow — AI-powered API contract factory + full-stack code generation engine')
  .version('0.1.0')
  .addHelpText(
    'after',
    `
🚀 Pipeline Stages:
  PRD → [Stage 1: Contract] → Swagger JSON → [Stage 2: Publish] → YApi → [Stage 3+4: Generate] → TS/Java/Go

Examples:
  $ yapi-flow init                     # 初始化项目配置
  $ yapi-flow run                      # 运行全链路流水线
  $ yapi-flow publish ./swagger.json   # 发布契约到 YApi
  $ yapi-flow generate --lang typescript  # 从 YApi 生成 TypeScript 代码

🔗 GitHub: https://github.com/duicym/yapi-flow`,
  )

program.addCommand(initCommand)
program.addCommand(runCommand)
program.addCommand(publishCommand)
program.addCommand(generateCommand)
program.addCommand(configCommand)
program.addCommand(doctorCommand)

program.parse()
