/**
 * 配置加载工具
 */
import { existsSync } from 'fs'
import { resolve } from 'path'
import type { YApiFlowConfig } from '@yapi-flow/shared'

/**
 * Load config from yapi-flow.config.ts using cosmiconfig
 * Falls back to default config pattern
 */
export async function loadConfig(configPath?: string): Promise<YApiFlowConfig | null> {
  const cwd = process.cwd()
  const paths = configPath
    ? [resolve(cwd, configPath)]
    : [
        resolve(cwd, 'yapi-flow.config.ts'),
        resolve(cwd, 'yapi-flow.config.js'),
        resolve(cwd, 'yapi-flow.config.mjs'),
      ]

  for (const p of paths) {
    if (existsSync(p)) {
      try {
        // Dynamic import for .ts/.mjs config files
        const mod = await import(p)
        const raw = mod.default || mod
        // Handle function configs (like vite)
        if (typeof raw === 'function') {
          return raw({})
        }
        return raw as YApiFlowConfig
      } catch (err) {
        console.warn(`Warning: Failed to load config from ${p}:`, (err as Error).message)
      }
    }
  }

  return null
}
