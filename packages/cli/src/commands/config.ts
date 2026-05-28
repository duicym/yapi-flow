/**
 * yapi-flow config — 管理配置
 */
import { Command } from 'commander'

export const configCommand = new Command('config')
  .description('Manage yapi-flow configuration')
  .addCommand(
    new Command('show')
      .description('Show current configuration')
      .action(async () => {
        try {
          const { loadConfig } = await import('../utils/config.js')
          const config = await loadConfig()
          if (!config) {
            console.log('No config found. Run "yapi-flow init" first.')
            return
          }
          // Mask token
          const safe = { ...config }
          if (safe.yapi?.token) safe.yapi.token = safe.yapi.token.substring(0, 8) + '***'
          if (safe.llm?.apiKey) safe.llm.apiKey = '***'
          console.log(JSON.stringify(safe, null, 2))
        } catch (err: any) {
          console.error(`Error: ${err.message}`)
        }
      }),
  )
  .addCommand(
    new Command('path')
      .description('Show config file path')
      .action(() => {
        console.log(resolve(process.cwd(), 'yapi-flow.config.ts'))
      }),
  )
