/**
 * yapi-flow generate — 从 YApi 生成代码 (Stage 3+4)
 */
import { Command } from 'commander'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { loadConfig } from '../utils/config.js'

export const generateCommand = new Command('generate')
  .description('Generate code from YApi interface definitions (Stage 3+4)')
  .option('-c, --config <path>', 'Config file path', 'yapi-flow.config.ts')
  .option('--lang <langs>', 'Target languages (comma-separated: typescript,java,go)', 'typescript')
  .option('--output <path>', 'Output directory')
  .option('--project-id <id>', 'YApi project ID (overrides config)')
  .option('--dry-run', 'Preview without writing files')
  .action(async (options) => {
    const config = await loadConfig(options.config)
    if (!config?.yapi?.token || !config?.yapi?.serverUrl) {
      console.error('❌ YApi config not set. Run "yapi-flow init" first.')
      process.exit(1)
    }

    const projectId = options.projectId || config.yapi.projectId
    const languages = (options.lang as string).split(',').map((s: string) => s.trim())
    const outDir = resolve(process.cwd(), options.output || config.generate?.outDir || './src/api/generated')

    console.log('🔧 YApi Flow — Code Generation\n')
    console.log(`  YApi:     ${config.yapi.serverUrl}`)
    console.log(`  Project:  ${projectId}`)
    console.log(`  Targets:  ${languages.join(', ')}`)
    console.log(`  Output:   ${outDir}\n`)

    try {
      // Dynamic imports
      const { CodegenEngine } = await import('@yapi-flow/generator')
      const engine = new CodegenEngine()

      const result = await engine.generateFromYApi(
        config.yapi.serverUrl,
        config.yapi.token,
        projectId,
        {
          targets: languages.map((lang: string) => ({
            language: lang as any,
            options: config.generate?.targets?.find(
              (t: any) => t.language === lang,
            )?.options || {},
          })),
          style: config.generate?.style,
        },
      )

      if (options.dryRun) {
        console.log('📝 Preview (dry-run):\n')
        for (const [lang, files] of Object.entries(result)) {
          console.log(`  [${lang}]`)
          for (const [filename, content] of Object.entries(files)) {
            console.log(`    ${filename} (${content.length} bytes)`)
          }
        }
        return
      }

      // Write generated files
      let totalFiles = 0
      for (const [lang, files] of Object.entries(result)) {
        const langDir = resolve(outDir, lang)
        mkdirSync(langDir, { recursive: true })

        for (const [filename, content] of Object.entries(files)) {
          const filePath = resolve(langDir, filename)
          writeFileSync(filePath, content, 'utf-8')
          totalFiles++
          console.log(`  ✅ ${lang}/${filename}`)
        }
      }

      console.log(`\n🎉 Generated ${totalFiles} files in ${outDir}`)
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`)
      process.exit(1)
    }
  })
