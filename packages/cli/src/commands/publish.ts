/**
 * yapi-flow publish — 发布 Swagger JSON 到 YApi
 */
import { Command } from 'commander'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { loadConfig, type YApiFlowConfig } from '../utils/config.js'

export const publishCommand = new Command('publish')
  .description('Publish Swagger/OpenAPI JSON to YApi (Stage 2)')
  .argument('<file>', 'Path to Swagger/OpenAPI JSON file')
  .option('-c, --config <path>', 'Config file path', 'yapi-flow.config.ts')
  .option('--merge <strategy>', 'Merge strategy: normal | good | merge', 'merge')
  .option('--dry-run', 'Validate only, do not publish')
  .action(async (file: string, options) => {
    const filePath = resolve(process.cwd(), file)
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`)
      process.exit(1)
    }

    const config = await loadConfig(options.config)
    if (!config?.yapi?.token || !config?.yapi?.serverUrl) {
      console.error('❌ YApi config not set. Run "yapi-flow init" first.')
      process.exit(1)
    }

    console.log('📤 YApi Flow — Contract Publishing\n')
    console.log(`  Source:  ${file}`)
    console.log(`  Target:  ${config.yapi.serverUrl}`)
    console.log(`  Project: ${config.yapi.projectId}`)
    console.log(`  Merge:   ${options.merge}\n`)

    if (options.dryRun) {
      // Read and validate
      const swaggerJson = readFileSync(filePath, 'utf-8')
      try {
        JSON.parse(swaggerJson)
        console.log('✅ Swagger JSON is valid.\n')
      } catch (e) {
        console.error('❌ Invalid JSON:', (e as Error).message)
        process.exit(1)
      }
      return
    }

    const swaggerJson = readFileSync(filePath, 'utf-8')

    // Dynamic import of publish package
    try {
      const { publishToYApi } = await import('@yapi-flow/publish')
      const result = await publishToYApi(
        {
          serverUrl: config.yapi.serverUrl,
          token: config.yapi.token,
          projectId: config.yapi.projectId,
          mergeStrategy: options.merge || config.publish?.mergeStrategy || 'merge',
        },
        swaggerJson,
      )

      if (result.errcode !== 0) {
        console.error(`❌ Publish failed: ${result.errmsg}`)
        process.exit(1)
      }

      console.log('✅ Published successfully!\n')
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`)
      console.log('\n💡 Try running "yapi-flow doctor" to check connectivity.')
      process.exit(1)
    }
  })
