/**
 * yapi-flow run — 执行全链路流水线
 */
import { Command } from 'commander'
import { loadConfig } from '../utils/config.js'

export const runCommand = new Command('run')
  .description('Run the full pipeline end-to-end')
  .option('-c, --config <path>', 'Config file path', 'yapi-flow.config.ts')
  .option('--from <stage>', 'Start from stage: contract | publish | generate')
  .option('--to <stage>', 'Stop at stage: contract | publish | generate')
  .option('--only <stage>', 'Run only one stage')
  .option('--dry-run', 'Preview without making changes')
  .action(async (options) => {
    const config = await loadConfig(options.config)
    if (!config) {
      console.error('❌ No config found. Run "yapi-flow init" first.')
      process.exit(1)
    }

    console.log('🚀 YApi Flow — Full Pipeline\n')
    console.log(`  Stages: ${options.only || 'contract → publish → generate'}`)
    console.log(`  YApi:   ${config.yapi?.serverUrl}\n`)

    try {
      const { Pipeline, PipelineContext } = await import('@yapi-flow/core')
      const pipeline = new Pipeline(config)

      // Register stages
      if (config.llm) {
        pipeline.registerStage('contract', async (ctx: PipelineContext) => {
          console.log('\n📝 Stage 1: Contract Generation (skipped — no input provided)')
          console.log('   Use "yapi-flow contract" to generate from PRD/natural language.')
        })
      }

      pipeline.registerStage('publish', async (ctx: PipelineContext) => {
        if (!config.yapi?.token) {
          console.log('  ⚠️  Stage 2 skipped: YApi token not configured')
          return
        }
        console.log('\n📤 Stage 2: Publishing to YApi...')
        if (options.dryRun) {
          console.log('   (dry-run mode, skipping)')
          return
        }
      })

      pipeline.registerStage('generate', async (ctx: PipelineContext) => {
        if (!config.yapi?.token) {
          console.log('  ⚠️  Stage 3 skipped: YApi token not configured')
          return
        }
        console.log('\n🔧 Stage 3: Generating Code...')
        if (options.dryRun) {
          console.log('   (dry-run mode, skipping)')
          return
        }
      })

      await pipeline.run(
        (options.from as any) || undefined,
        (options.to as any) || undefined,
      )

      console.log('\n✅ Pipeline complete!\n')
    } catch (err: any) {
      console.error(`\n❌ Pipeline failed: ${err.message}\n`)
      process.exit(1)
    }
  })
