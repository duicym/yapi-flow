import type { YApiCategory, YApiInterface, YApiParam } from '@yapi-flow/shared'
import { logger } from '@yapi-flow/shared'

// ============================================================
// Internal representation types
// ============================================================

export interface NormalizedInterface {
  name: string
  method: string
  path: string
  summary: string
  category: string
  requestType?: string
  responseType?: string
  params: NormalizedParam[]
  responseFields: NormalizedField[]
}

export interface NormalizedParam {
  name: string
  type: string
  required: boolean
  description: string
  example?: string
  location: 'query' | 'path' | 'header' | 'body'
  fields?: NormalizedField[]
}

export interface NormalizedField {
  name: string
  type: string
  required: boolean
  description: string
  example?: string
  children?: NormalizedField[]
}

// ============================================================
// Path to interface name conversion
// ============================================================

/**
 * Convert an API path to a camelCase interface basename.
 * Strips leading /api/ prefix, then converts slash-separated
 * segments to camelCase.
 *
 * Examples:
 *   /api/user/sign-in  ->  userSignIn
 *   /user/profile       ->  userProfile
 *   /api/v1/items       ->  v1Items
 */
export function pathToName(path: string): string {
  let cleaned = path
    .replace(/^\/api\//, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')

  if (!cleaned) return 'index'

  const segments = cleaned.split('/').filter(Boolean)
  return segments
    .map((segment, index) => {
      // Handle segments with hyphens or underscores
      const words = segment.split(/[-_]/)
      return words
        .map((word, wordIndex) => {
          if (index === 0 && wordIndex === 0) {
            return word.toLowerCase()
          }
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        })
        .join('')
    })
    .join('')
}

/**
 * Capitalize the first letter of a camelCase name.
 * Used for generating PascalCase type names.
 */
export function toPascalCase(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// ============================================================
// Type inference from YApi types
// ============================================================

/**
 * Map YApi type strings to TypeScript type strings.
 */
export function inferType(yapiParam: YApiParam): string {
  const rawType = (yapiParam.type || '').trim().toLowerCase()

  switch (rawType) {
    case 'string':
      return 'string'
    case 'number':
    case 'integer':
    case 'float':
    case 'double':
      return 'number'
    case 'boolean':
    case 'bool':
      return 'boolean'
    case 'array':
      return 'any[]'
    case 'object':
    case 'json':
      return 'Record<string, any>'
    default:
      // If type is undefined or unrecognized, fall back to 'any'
      if (!rawType) return 'any'
      // Could be an enum or custom type name, keep as-is
      return rawType
  }
}

// ============================================================
// JSON body parsing for response fields
// ============================================================

/**
 * Parse a JSON response body string into NormalizedField[].
 * Handles both plain JSON objects and JSON Schema style.
 */
export function parseJsonSchema(jsonStr: string): NormalizedField[] {
  if (!jsonStr || jsonStr.trim() === '') return []

  try {
    const parsed = JSON.parse(jsonStr)
    return extractFields(parsed)
  } catch {
    logger.warn('[normalizer] Failed to parse res_body as JSON, returning empty fields')
    return []
  }
}

/**
 * Recursively extract NormalizedField[] from a parsed JSON value.
 * Supports:
 *  - JSON Schema style: { type: "object", properties: { ... } }
 *  - Plain object: { fieldName: value }
 *  - JSON Schema array: { type: "array", items: { type: "string" } }
 */
function extractFields(node: any): NormalizedField[] {
  if (!node || typeof node !== 'object') return []

  // JSON Schema object style
  if (node.type === 'object' && node.properties && typeof node.properties === 'object') {
    const required: Set<string> = new Set(
      Array.isArray(node.required) ? node.required : []
    )
    return Object.entries(node.properties).map(([propName, propDef]: [string, any]) => {
      const field: NormalizedField = {
        name: propName,
        type: 'any',
        required: required.has(propName),
        description: propDef?.description || '',
      }

      if (propDef?.type === 'array') {
        const itemType = propDef.items?.type || 'any'
        const itemRef = propDef.items?.$ref || ''
        if (propDef.items?.type === 'object' || propDef.items?.properties) {
          field.type = 'Array' + toPascalCase(propName)
          field.children = extractFields({
            type: 'object',
            properties: propDef.items.properties,
            required: propDef.items.required,
          })
        } else if (itemRef) {
          field.type = `Array<${refToTypeName(itemRef)}>`
        } else {
          field.type = `${mapJsonSchemaType(itemType)}[]`
        }
      } else if (propDef?.type === 'object' || propDef?.properties) {
        field.type = toPascalCase(propName)
        field.children = extractFields(propDef)
      } else if (propDef?.type) {
        field.type = mapJsonSchemaType(propDef.type)
      } else if (propDef?.$ref) {
        field.type = refToTypeName(propDef.$ref)
      }

      if (propDef?.example !== undefined) {
        field.example = String(propDef.example)
      }

      return field
    })
  }

  // JSON Schema array at root
  if (node.type === 'array' && node.items) {
    return extractFields(node.items)
  }

  // Plain JSON object: infer types from values
  return Object.entries(node).map(([key, value]) => {
    const field: NormalizedField = {
      name: key,
      type: inferJsonValueType(value),
      required: false,
      description: '',
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      field.children = extractFields(value)
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      field.type = `Array<${toPascalCase(key)}>`
      field.children = extractFields(value[0])
    }

    return field
  })
}

/**
 * Map JSON Schema type name to TypeScript type.
 */
function mapJsonSchemaType(type: string): string {
  switch (type) {
    case 'string': return 'string'
    case 'number': case 'integer': case 'float': case 'double': return 'number'
    case 'boolean': return 'boolean'
    case 'array': return 'any[]'
    case 'object': return 'Record<string, any>'
    case 'null': return 'null'
    default: return 'any'
  }
}

/**
 * Extract type name from a $ref path (e.g. "#/definitions/User" -> "User").
 */
function refToTypeName(ref: string): string {
  const parts = ref.split('/')
  return parts[parts.length - 1] || ref
}

/**
 * Infer TypeScript type from a JSON value.
 */
function inferJsonValueType(value: any): string {
  if (value === null || value === undefined) return 'any'
  if (Array.isArray(value)) return 'any[]'
  switch (typeof value) {
    case 'string': return 'string'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'object': return 'Record<string, any>'
    default: return 'any'
  }
}

// ============================================================
// Interface name generation
// ============================================================

/**
 * Generate request/response type names from a base name and HTTP method.
 * Format: {PascalName}{Method}Request / {PascalName}{Method}Response
 *
 * Examples:
 *   userSignIn, POST  ->  UserSignInPostRequest, UserSignInPostResponse
 *   listItems, GET    ->  ListItemsGetRequest, ListItemsGetResponse
 */
export function generateTypeNames(
  baseName: string,
  method: string
): { requestType: string; responseType: string } {
  const pascalBase = toPascalCase(baseName)
  const methodPascal = toPascalCase(method.toLowerCase())
  return {
    requestType: `${pascalBase}${methodPascal}Request`,
    responseType: `${pascalBase}${methodPascal}Response`,
  }
}

// ============================================================
// Parameter normalization
// ============================================================

/**
 * Convert YApiParam[] to NormalizedParam[] with the given location.
 */
function normalizeParams(
  items: YApiParam[] | undefined,
  location: NormalizedParam['location']
): NormalizedParam[] {
  if (!items || !Array.isArray(items)) return []

  return items.map((p) => ({
    name: p.name,
    type: inferType(p),
    required: p.required === '1' || p.required === 'true',
    description: p.desc || '',
    example: p.example,
    location,
  }))
}

// ============================================================
// Main normalization function
// ============================================================

/**
 * Normalize all YApi interfaces from categories into a flat list of
 * NormalizedInterface records, ready for code generation.
 */
export function normalizeInterfaces(
  categories: YApiCategory[]
): NormalizedInterface[] {
  const result: NormalizedInterface[] = []

  for (const cat of categories) {
    const interfaces = cat.list || []
    for (const iface of interfaces) {
      try {
        result.push(normalizeOne(iface, cat.name))
      } catch (err) {
        logger.warn(
          `[normalizer] Skipping interface ${iface.path || '(unknown)'}: ${err}`
        )
      }
    }
  }

  logger.info(`[normalizer] Normalized ${result.length} interfaces`)
  return result
}

/**
 * Normalize a single YApi interface.
 */
function normalizeOne(
  iface: YApiInterface,
  categoryName: string
): NormalizedInterface {
  const baseName = pathToName(iface.path)
  const typeNames = generateTypeNames(baseName, iface.method)

  // Collect params from all locations
  const queryParams = normalizeParams(iface.req_query, 'query')
  const pathParams = normalizeParams(iface.req_params, 'path')
  const headerParams = normalizeParams(iface.req_headers, 'header')
  const bodyParams = normalizeParams(iface.req_body_form, 'body')

  const allParams = [
    ...pathParams,
    ...queryParams,
    ...headerParams,
    ...bodyParams,
  ]

  // Parse response body
  const responseFields = parseJsonSchema(iface.res_body || '')

  return {
    name: baseName,
    method: iface.method.toUpperCase(),
    path: iface.path,
    summary: iface.title || iface.desc || '',
    category: categoryName,
    requestType: typeNames.requestType,
    responseType: typeNames.responseType,
    params: allParams,
    responseFields,
  }
}
