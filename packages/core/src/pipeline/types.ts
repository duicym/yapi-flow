import type { YApiFlowConfig, Logger } from '@yapi-flow/shared'

/** Pipeline 执行阶段 */
export type PipelineStage = 'contract' | 'publish' | 'generate'

/** Pipeline 执行上下文 */
export interface PipelineContext {
  /** 用户配置 */
  config: YApiFlowConfig
  /** 阶段 1：生成的 Swagger JSON */
  swaggerJson?: any
  /** 阶段 2：YApi 导入结果 */
  yapiResult?: any
  /** 阶段 3：生成的代码文件（文件名 -> 文件内容） */
  generatedFiles?: Record<string, string>
  /** 日志实例 */
  logger: Logger
  /** 存储阶段结果（供后续阶段引用） */
  setResult(stage: string, data: any): void
  /** 获取阶段结果 */
  getResult(stage: string): any
}

/** 单个阶段的执行结果 */
export interface PipelineResult {
  success: boolean
  stage: PipelineStage
  data?: any
  error?: Error
}
