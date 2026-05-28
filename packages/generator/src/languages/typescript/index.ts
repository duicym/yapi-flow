import type { YApiCategory } from '@yapi-flow/shared'
import type { NormalizedInterface } from '../normalizer'
import { normalizeInterfaces } from '../normalizer'
import { generateTypeDefinitions } from './interface-generator'
import { generateAxiosClient, generateFetchClient } from './client-generator'

export interface TypeScriptGenerateOptions {
  /** HTTP 客户端类型 */
  client?: 'axios' | 'fetch'
  /** 生成 MSW mock handlers */
  generateMSW?: boolean
  /** 生成 Zod 校验 schemas */
  generateZod?: boolean
  /** 使用严格的 TypeScript 类型 */
  strictTypes?: boolean
  /** axios request 工具导入路径 */
  importRequestFrom?: string
  /** API 路径前缀 */
  requestPathPrefix?: string
}

const defaultOptions: TypeScriptGenerateOptions = {
  client: 'axios',
  generateMSW: false,
  generateZod: false,
  strictTypes: true,
  importRequestFrom: '@/utils/request',
}

/**
 * Generate TypeScript code files from YApi categories.
 * Returns a map of filename -> content.
 */
export function generate(
  categories: YApiCategory[],
  options: TypeScriptGenerateOptions = {},
): Record<string, string> {
  const opts = { ...defaultOptions, ...options }
  const interfaces = normalizeInterfaces(categories)

  if (interfaces.length === 0) {
    return {}
  }

  const files: Record<string, string> = {}

  // types.ts — all type definitions
  files['types.ts'] = generateTypeDefinitions(interfaces)

  // client.ts — request functions
  if (opts.client === 'fetch') {
    files['client.ts'] = generateFetchClient(interfaces, opts.requestPathPrefix || '/api')
  } else {
    files['client.ts'] = generateAxiosClient(interfaces, opts.importRequestFrom)
  }

  // msw-mocks.ts — MSW mock handlers (future)
  if (opts.generateMSW) {
    files['msw-mocks.ts'] = generateMSWMocks(interfaces)
  }

  // zod-schemas.ts — Zod validation schemas (future)
  if (opts.generateZod) {
    files['zod-schemas.ts'] = generateZodSchemas(interfaces)
  }

  return files
}

function generateMSWMocks(interfaces: NormalizedInterface[]): string {
  // Placeholder - will be implemented in future version
  return [
    '// Auto-generated MSW mock handlers',
    '// TODO: Will be implemented in a future version',
    `// ${interfaces.length} interfaces available for mock generation`,
    '',
  ].join('\n')
}

function generateZodSchemas(interfaces: NormalizedInterface[]): string {
  // Placeholder - will be implemented in future version
  return [
    '// Auto-generated Zod validation schemas',
    '// TODO: Will be implemented in a future version',
    `// ${interfaces.length} interfaces available for schema generation`,
    '',
  ].join('\n')
}
