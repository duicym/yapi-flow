import type { YApiCategory, GenerateTarget, CodeStyle, Logger } from '@yapi-flow/shared'
import { logger as defaultLogger } from '@yapi-flow/shared'
import { generate as generateTS, type TypeScriptGenerateOptions } from './languages/typescript'

export interface GenerateOptions {
  /** 多语言目标 */
  targets: GenerateTarget[]
  /** 代码风格 */
  style?: CodeStyle
  /** Logger 实例 */
  logger?: Logger
}

/**
 * 代码生成引擎
 *
 * 从 YApi 接口定义生成多语言代码。
 * 支持：TypeScript, Java (Spring Boot), Go (Gin), Node.js (Express)
 */
export class CodegenEngine {
  private logger: Logger

  constructor(logger?: Logger) {
    this.logger = logger || defaultLogger
  }

  /**
   * 从 YApi 接口分类生成代码
   * @returns { [language]: { [filename]: content } }
   */
  generate(
    categories: YApiCategory[],
    options: GenerateOptions,
  ): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}

    for (const target of options.targets) {
      const lang = target.language
      this.logger.info(`Generating ${lang} code...`)

      try {
        switch (lang) {
          case 'typescript':
            result[lang] = generateTS(categories, target.options as TypeScriptGenerateOptions)
            break
          case 'java':
            this.logger.info(`[java] Not yet implemented in v0.1`)
            result[lang] = {}
            break
          case 'go':
            this.logger.info(`[go] Not yet implemented in v0.1`)
            result[lang] = {}
            break
          case 'nodejs':
            this.logger.info(`[nodejs] Not yet implemented in v0.1`)
            result[lang] = {}
            break
          default:
            this.logger.warn(`Unknown language: ${lang}`)
            break
        }
      } catch (err) {
        this.logger.error(`Failed to generate ${lang} code:`, err)
      }
    }

    const total = Object.values(result).reduce(
      (sum, files) => sum + Object.keys(files).length,
      0,
    )
    this.logger.info(`Generated ${total} files across ${Object.keys(result).length} languages`)

    return result
  }

  /**
   * 从 YApi 服务端拉取接口数据并生成代码
   */
  async generateFromYApi(
    baseUrl: string,
    token: string,
    projectId: number,
    options: GenerateOptions,
  ): Promise<Record<string, Record<string, string>>> {
    this.logger.info(`Fetching interfaces from YApi: ${baseUrl}`)

    const url = `${baseUrl}/api/interface/list_menu?project_id=${projectId}&token=${token}`
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch YApi data: HTTP ${response.status}`)
    }

    const json = await response.json()
    if (json.errcode !== 0) {
      throw new Error(`YApi error: ${json.errmsg}`)
    }

    const categories: YApiCategory[] = json.data || []
    this.logger.info(
      `Fetched ${categories.reduce((sum, c) => sum + (c.list?.length || 0), 0)} interfaces in ${categories.length} categories`,
    )

    return this.generate(categories, options)
  }
}
