import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import type { YApiFlowConfig } from '@yapi-flow/shared'
import { Logger } from '@yapi-flow/shared'
import { PipelineContext } from './context'
import type { PipelineStage } from './types'

const execAsync = promisify(exec)

/** 阶段执行顺序 */
const STAGE_ORDER: PipelineStage[] = ['contract', 'publish', 'generate']

/** 阶段名称到 hooks 键的映射 */
const STAGE_NAME_MAP: Record<PipelineStage, string> = {
  contract: 'Contract',
  publish: 'Publish',
  generate: 'Generate',
}

/**
 * Pipeline 编排引擎
 *
 * 按 contract -> publish -> generate 的顺序执行各阶段，
 * 在每个阶段前后调用对应的生命周期钩子。
 *
 * 使用方式：
 * ```
 * const pipeline = new Pipeline(config)
 * pipeline.registerStage('contract', contractHandler)
 * pipeline.registerStage('publish', publishHandler)
 * pipeline.registerStage('generate', generateHandler)
 * const ctx = await pipeline.run()
 * ```
 */
export class Pipeline {
  private config: YApiFlowConfig
  private handlers: Map<PipelineStage, (ctx: PipelineContext) => Promise<void>>
  private logger: Logger

  constructor(config: YApiFlowConfig) {
    this.config = config
    this.handlers = new Map()
    this.logger = new Logger()
  }

  /**
   * 注册某个阶段的实际处理器
   * @param stage - 阶段名称
   * @param handler - 处理器函数，接收 PipelineContext，返回 Promise
   */
  registerStage(
    stage: PipelineStage,
    handler: (ctx: PipelineContext) => Promise<void>,
  ): void {
    this.handlers.set(stage, handler)
  }

  /**
   * 运行 Pipeline
   * @param fromStage - 起始阶段（默认 'contract'）
   * @param toStage - 终止阶段（默认 'generate'），包含此阶段
   * @returns 包含各阶段结果的 PipelineContext
   */
  async run(
    fromStage?: PipelineStage,
    toStage?: PipelineStage,
  ): Promise<PipelineContext> {
    const ctx = new PipelineContext(this.config, this.logger)

    const fromIndex = fromStage ? STAGE_ORDER.indexOf(fromStage) : 0
    const toIndex = toStage
      ? STAGE_ORDER.indexOf(toStage) + 1
      : STAGE_ORDER.length

    const stages = STAGE_ORDER.slice(fromIndex, toIndex)

    this.logger.info(
      `Pipeline starting: ${stages.join(' -> ')}`,
    )

    for (const stage of stages) {
      const stageName = STAGE_NAME_MAP[stage]

      try {
        // 执行 before 钩子
        await this.executeHook(`before${stageName}`)

        // 执行阶段处理器
        this.logger.info(`[${stage}] stage started`)
        const handler = this.handlers.get(stage)
        if (handler) {
          await handler(ctx)
        } else {
          this.logger.warn(`No handler registered for stage "${stage}"`)
        }

        // 执行 after 钩子
        await this.executeHook(`after${stageName}`)

        this.logger.info(`[${stage}] stage completed`)
      } catch (error) {
        this.logger.error(`Pipeline stage "${stage}" failed:`, error)
        throw error
      }
    }

    this.logger.info('Pipeline finished')
    return ctx
  }

  /**
   * 执行单个钩子命令
   * 钩子命令失败时仅警告，不中断 Pipeline
   */
  private async executeHook(hookName: string): Promise<void> {
    const hooks = this.config.hooks
    if (!hooks) return

    const command = hooks[hookName as keyof typeof hooks] as string | undefined
    if (!command) return

    this.logger.info(`Hook: ${hookName}`)
    try {
      const { stdout, stderr } = await execAsync(command)
      if (stdout) this.logger.debug(stdout.trim())
      if (stderr) this.logger.warn(stderr.trim())
    } catch (error) {
      // 钩子失败不中断 Pipeline
      this.logger.warn(`Hook "${hookName}" failed:`, error)
    }
  }
}
