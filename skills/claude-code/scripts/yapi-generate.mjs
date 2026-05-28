#!/usr/bin/env node
/**
 * 阶段二+三：代码生成 — YApi → TypeScript / Java / Go
 *
 * Usage:
 *   node scripts/yapi-generate.mjs --base-url URL --token TOKEN --project-id 123 --lang typescript --output ./src/api
 */
import { parseArgs } from 'node:util'
import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { YApiClient } from './yapi-client.mjs'

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    token: { type: 'string' },
    'project-id': { type: 'string' },
    lang: { type: 'string', default: 'typescript' },
    output: { type: 'string', default: './src/api/generated' },
    client: { type: 'string', default: 'axios' },
    'request-from': { type: 'string', default: '@/utils/request' },
  },
})

// ─── 类型映射 ───
function inferType(param) {
  const t = (param.type || '').toLowerCase()
  switch (t) {
    case 'string': return 'string'
    case 'number': case 'integer': case 'float': case 'double': return 'number'
    case 'boolean': case 'bool': return 'boolean'
    case 'array': return 'any[]'
    case 'object': case 'json': return 'Record<string, any>'
    default: return t || 'any'
  }
}

// ─── 路径转命名 ───
function pathToName(path) {
  let cleaned = path.replace(/^\/api\//, '').replace(/^\/+/, '').replace(/\/+$/, '')
  if (!cleaned) return 'index'
  return cleaned.split('/').filter(Boolean)
    .map((seg, i) => seg.split(/[-_]/).map((w, j) =>
      i === 0 && j === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    ).join('')).join('')
}

function toPascal(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

// ─── JSON 解析 → 字段列表 ───
function parseFields(jsonStr) {
  if (!jsonStr) return []
  try {
    const obj = JSON.parse(jsonStr)
    if (obj.properties) {
      const required = new Set(obj.required || [])
      return Object.entries(obj.properties).map(([name, def]) => ({
        name,
        type: def.$ref ? def.$ref.split('/').pop() :
              def.type === 'array' ? `${def.items?.$ref?.split('/').pop() || inferType(def.items || {})}[]` :
              def.type === 'object' ? toPascal(name) :
              inferType(def),
        required: required.has(name),
        desc: def.description || '',
      }))
    }
    return Object.entries(obj).map(([k, v]) => ({
      name: k,
      type: typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' :
            Array.isArray(v) ? 'any[]' : typeof v === 'object' ? 'Record<string, any>' : 'string',
      required: false,
      desc: '',
    }))
  } catch { return [] }
}

// ─── 生成 TypeScript ───
function generateTS(interfaces, options) {
  const imports = options.client === 'fetch' ? [] : [`import { request } from '${options['request-from']}'`]
  const types = [], clients = []
  const typeNames = new Set()

  for (const api of interfaces) {
    const baseName = pathToName(api.path)
    const reqType = `${toPascal(baseName)}${toPascal(api.method.toLowerCase())}Request`
    const respType = `${toPascal(baseName)}${toPascal(api.method.toLowerCase())}Response`

    // 请求参数
    const params = [
      ...(api.req_query || []).map(p => ({ ...p, loc: 'query', ts: inferType(p), req: p.required === '1' })),
      ...(api.req_path || []).map(p => ({ ...p, loc: 'path', ts: inferType(p), req: true })),
      ...(api.req_body_form || []).map(p => ({ ...p, loc: 'body', ts: inferType(p), req: p.required === '1' })),
    ]

    // 响应字段
    const respFields = parseFields(api.res_body)

    // 生成 Request 接口
    if (params.length > 0 && !typeNames.has(reqType)) {
      typeNames.add(reqType)
      const lines = [`/** ${api.title || api.path} - Request */`, `export interface ${reqType} {`]
      for (const p of params) {
        if (p.desc) lines.push(`  /** ${p.desc} */`)
        lines.push(`  ${p.name}${p.req ? '' : '?'}: ${p.ts}`)
      }
      lines.push('}', '')
      types.push(...lines)
    }

    // 生成 Response 接口
    if (respFields.length > 0 && !typeNames.has(respType)) {
      typeNames.add(respType)
      const lines = [`/** ${api.title || api.path} - Response */`, `export interface ${respType} {`]
      for (const f of respFields) {
        if (f.desc) lines.push(`  /** ${f.desc} */`)
        lines.push(`  ${f.name}${f.required ? '' : '?'}: ${f.type}`)
      }
      lines.push('}', '')
      types.push(...lines)
    }

    // 生成请求函数
    if (api.summary) clients.push(`/** ${api.summary} */`)
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(api.method.toUpperCase())
    const queryParams = params.filter(p => p.loc === 'query')
    const hasQuery = queryParams.length > 0

    const funcArgs = []
    if (hasBody && typeNames.has(reqType)) funcArgs.push(`data: ${reqType}`)
    if (hasQuery) funcArgs.push(`params: { ${queryParams.map(p => `${p.name}${p.req ? '' : '?'}: ${p.ts}`).join('; ')} }`)
    const retType = typeNames.has(respType) ? respType : 'any'

    if (options.client === 'fetch') {
      clients.push(`export async function ${baseName}(${funcArgs.join(', ')}): Promise<${retType}> {`)
      clients.push(`  const url = new URL('${api.path}', BASE_URL)`)
      clients.push(`  const resp = await fetch(url, {`)
      clients.push(`    method: '${api.method.toUpperCase()}',`)
      if (hasBody) clients.push(`    headers: { 'Content-Type': 'application/json' },`, `    body: JSON.stringify(data),`)
      clients.push(`  })`)
      clients.push(`  if (!resp.ok) throw new Error(\`API error: \${resp.status}\`)`)
      clients.push(`  return resp.json()`, `}`, '')
    } else {
      clients.push(`export async function ${baseName}(${funcArgs.join(', ')}): Promise<${retType}> {`)
      const config = [`  return request<${retType}>({`, `    url: '${api.path}',`, `    method: '${api.method.toUpperCase()}',`]
      if (hasBody && typeNames.has(reqType)) config.push(`    data,`)
      if (hasQuery) config.push(`    params,`)
      config.push(`  })`)
      clients.push(...config, `}`, '')
    }
  }

  const header = ['// ============================================================', '// Auto-generated by YApi Flow', '// ============================================================', '']
  const typesFile = [...header, `// ===== Type Definitions =====`, '', ...types].join('\n')
  const clientFile = [...header, `// ===== Request Functions =====`, '', ...imports, '', ...clients].join('\n')

  return { 'types.ts': typesFile, 'client.ts': clientFile }
}

// ─── Main ───
async function main() {
  if (!values['base-url'] || !values.token || !values['project-id']) {
    console.error('Usage: yapi-generate.mjs --base-url URL --token TOKEN --project-id ID --lang typescript')
    process.exit(1)
  }

  const client = new YApiClient(values['base-url'], values.token)

  // 拉取接口数据
  console.log(`📡 Fetching interfaces from YApi...`)
  const result = await client.listMenu(values['project-id'])
  if (result.errcode !== 0) {
    console.error(`❌ YApi error: ${result.errmsg}`)
    process.exit(1)
  }

  const categories = result.data || []
  const allInterfaces = categories.flatMap(c => (c.list || []).map(api => ({ ...api, categoryName: c.name })))
  console.log(`📋 Found ${allInterfaces.length} interfaces in ${categories.length} categories`)

  // 按语言生成代码
  const lang = values.lang
  let files = {}

  if (lang === 'typescript') {
    files = generateTS(allInterfaces, { client: values.client, 'request-from': values['request-from'] })
  } else if (['java', 'go', 'nodejs'].includes(lang)) {
    console.log(`⚠️  ${lang} code generation is not yet implemented in skill v0.1`)
    return
  }

  // 写入文件
  const outDir = resolve(values.output)
  mkdirSync(outDir, { recursive: true })

  for (const [filename, content] of Object.entries(files)) {
    const filePath = resolve(outDir, filename)
    writeFileSync(filePath, content, 'utf-8')
    console.log(`✅ ${outDir}/${filename}`)
  }

  console.log(`\n🎉 Generated ${Object.keys(files).length} files in ${outDir}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
