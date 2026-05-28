/**
 * 简化版 OpenAPI 3.0 类型定义（代码生成所需字段）
 */
export interface OpenAPISpec {
  openapi: string
  info: OpenAPIInfo
  paths: Record<string, PathItem>
  components?: Components
  tags?: Tag[]
}

export interface OpenAPIInfo {
  title: string
  version: string
  description?: string
}

export interface PathItem {
  get?: Operation
  post?: Operation
  put?: Operation
  delete?: Operation
  patch?: Operation
  options?: Operation
  head?: Operation
}

export interface Operation {
  summary?: string
  description?: string
  operationId?: string
  tags?: string[]
  parameters?: Parameter[]
  requestBody?: RequestBody
  responses: Record<string, Response>
  deprecated?: boolean
}

export interface Parameter {
  name: string
  in: 'query' | 'header' | 'path' | 'cookie'
  required?: boolean
  description?: string
  schema?: Schema
  example?: any
}

export interface RequestBody {
  description?: string
  required?: boolean
  content: Record<string, MediaType>
}

export interface Response {
  description: string
  content?: Record<string, MediaType>
}

export interface MediaType {
  schema?: Schema
  example?: any
}

export interface Schema {
  type?: string
  format?: string
  properties?: Record<string, Schema>
  items?: Schema
  required?: string[]
  enum?: any[]
  description?: string
  example?: any
  nullable?: boolean
  $ref?: string
  oneOf?: Schema[]
  allOf?: Schema[]
  anyOf?: Schema[]
  additionalProperties?: boolean | Schema
}

export interface Components {
  schemas?: Record<string, Schema>
  parameters?: Record<string, Parameter>
  responses?: Record<string, Response>
}

export interface Tag {
  name: string
  description?: string
}
