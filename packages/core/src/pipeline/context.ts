import type { YApiFlowConfig, Logger } from '@yapi-flow/shared'

/**
 * Pipeline 上下文
 * 在 Pipeline 执行期间持有配置、中间结果和日志实例，
 * 各个阶段通过 ctx 共享数据。
 */
export class PipelineContext {
  config: YApiFlowConfig
  swaggerJson?: any
  yapiResult?: any
  generatedFiles?: Record<string, string>
  logger: Logger

  private results: Map<string, any>

  constructor(config: YApiFlowConfig, logger: Logger) {
    this.config = config
    this.logger = logger
    this.results = new Map()
  }

  /** 存储阶段结果（供后续阶段通过 getResult 获取） */
  setResult(stage: string, data: any): void {
    this.results.set(stage, data)
  }

  /** 获取之前阶段的结果 */
  getResult(stage: string): any {
    return this.results.get(stage)
  }
}
