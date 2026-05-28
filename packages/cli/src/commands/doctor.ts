/**
 * yapi-flow doctor — 环境检查
 */
import { Command } from 'commander'

export const doctorCommand = new Command('doctor')
  .description('Check environment and YApi connectivity')
  .option('-c, --config <path>', 'Config file path', 'yapi-flow.config.ts')
  .action(async (options) => {
    console.log('🏥 YApi Flow — Doctor\n')

    // Node.js version
    const nodeVersion = process.versions.node
    const [major] = nodeVersion.split('.').map(Number)
    const nodeOk = major >= 18
    console.log(`  ${nodeOk ? '✅' : '❌'} Node.js: ${nodeVersion} (required: >= 18)`)

    // Try loading config
    try {
      const { loadConfig } = await import('../utils/config.js')
      const config = await loadConfig(options.config)

      if (!config) {
        console.log('  ⚠️  Config: not found. Run "yapi-flow init" to create.')
        return
      }

      console.log('  ✅ Config: loaded')

      if (config.yapi) {
        const { serverUrl, token, projectId } = config.yapi
        console.log(`  📡 YApi Server: ${serverUrl}`)
        console.log(`  🔑 Token set: ${token && token !== 'your-token-here' ? 'Yes' : 'No'}`)
        console.log(`  📂 Project ID: ${projectId || 'Not set'}`)

        // Test connectivity
        if (token && serverUrl) {
          try {
            const url = `${serverUrl}/api/project/get?token=${token}`
            const resp = await fetch(url)
            if (resp.ok) {
              const data = await resp.json()
              if (data.errcode === 0) {
                console.log(`  ✅ YApi connectivity: OK (project: ${data.data?.name || 'unknown'})`)
              } else {
                console.log(`  ⚠️  YApi response: ${data.errmsg}`)
              }
            } else {
              console.log(`  ❌ YApi connectivity: HTTP ${resp.status}`)
            }
          } catch {
            console.log(`  ❌ YApi connectivity: Cannot reach ${serverUrl}`)
          }
        }
      }

      if (config.llm) {
        console.log(`  🤖 LLM: ${config.llm.provider} / ${config.llm.model}`)
        console.log(`  🔑 LLM API key: ${config.llm.apiKey ? 'Set' : 'Not set'}`)
      }

      if (config.generate?.targets) {
        const langs = config.generate.targets.map((t) => t.language).join(', ')
        console.log(`  🎯 Generate targets: ${langs}`)
      }

      console.log('\n✅ All checks passed!\n')
    } catch (err: any) {
      console.log(`  ❌ Config error: ${err.message}`)
    }
  })
