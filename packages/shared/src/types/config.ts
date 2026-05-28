/**
 * YApi Flow 完整配置类型定义
 */
export interface YApiFlowConfig {
  /** YApi 连接配置 */
  yapi: YApiConfig
  /** LLM Provider 配置 */
  llm?: LLMConfig
  /** 契约生成配置 */
  contract?: ContractConfig
  /** 契约发布配置 */
  publish?: PublishConfig
  /** 代码生成配置 */
  generate?: GenerateConfig
  /** 生命周期钩子 */
  hooks?: HooksConfig
}

export interface YApiConfig {
  /** YApi 服务地址 */
  serverUrl: string
  /** 项目 Token */
  token: string
  /** 项目 ID */
  projectId: number
}

export interface LLMConfig {
  /** LLM 提供商 */
  provider: 'openai' | 'anthropic' | 'custom'
  /** API Key */
  apiKey: string
  /** 模型名称 */
  model: string
  /** API 基础 URL（支持代理） */
  baseURL?: string
  /** 温度参数 */
  temperature?: number
}

export interface ContractConfig {
  /** 输出目录 */
  outputDir: string
  /** Prompt 模板 */
  promptTemplate?: string
  /** 校验配置 */
  validation?: {
    strict?: boolean
    autoFix?: boolean
  }
}

export interface PublishConfig {
  /** 合并策略 */
  mergeStrategy: 'normal' | 'good' | 'merge'
  /** 自动打标签 */
  autoTag?: boolean
  /** 标签前缀 */
  tagPrefix?: string
}

export interface GenerateConfig {
  /** 输出根目录 */
  outDir: string
  /** 多语言目标 */
  targets: GenerateTarget[]
  /** 代码风格 */
  style?: CodeStyle
}

export interface GenerateTarget {
  /** 目标语言 */
  language: 'typescript' | 'java' | 'go' | 'nodejs'
  /** 输出目录 */
  outDir?: string
  /** 语言特定选项 */
  options?: Record<string, any>
}

export interface CodeStyle {
  indent?: number
  quotes?: 'single' | 'double'
  semi?: boolean
  trailingComma?: 'none' | 'all'
}

export interface HooksConfig {
  beforeContract?: string
  afterContract?: string
  beforePublish?: string
  afterPublish?: string
  beforeGenerate?: string
  afterGenerate?: string
}
