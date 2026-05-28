/**
 * yapi-flow init — 初始化项目配置
 */
import { Command } from 'commander'
import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export const initCommand = new Command('init')
  .description('Initialize yapi-flow config in current project')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log('🚀 YApi Flow — Project Initialization\n')

    const cwd = process.cwd()
    const configPath = resolve(cwd, 'yapi-flow.config.ts')

    if (existsSync(configPath) && !options.yes) {
      console.log('⚠️  yapi-flow.config.ts already exists.')
      console.log('   Use --yes to overwrite, or edit manually.\n')
      return
    }

    const configContent = `import { defineConfig } from 'yapi-flow'

export default defineConfig({
  /** YApi 连接配置 */
  yapi: {
    serverUrl: 'http://yapi.example.com',
    token: process.env.YAPI_TOKEN || 'your-token-here',
    projectId: 0,
  },

  /** 契约发布配置 (Stage 2) */
  publish: {
    mergeStrategy: 'merge',
    autoTag: true,
  },

  /** 代码生成配置 (Stage 3+4) */
  generate: {
    outDir: './src/api/generated',
    targets: [
      {
        language: 'typescript',
        options: {
          client: 'axios',
          generateMSW: true,
          importRequestFrom: '@/utils/request',
        },
      },
    ],
    style: {
      indent: 2,
      quotes: 'single',
      semi: false,
      trailingComma: 'all',
    },
  },
})
`

    writeFileSync(configPath, configContent, 'utf-8')
    console.log('✅ Created yapi-flow.config.ts\n')
    console.log('Next steps:')
    console.log('  1. Edit yapi-flow.config.ts — set your YApi serverUrl, token, and projectId')
    console.log('  2. Run: npx yapi-flow doctor   — check connectivity')
    console.log('  3. Run: npx yapi-flow generate  — generate code from YApi')
    console.log('')
  })
