#!/usr/bin/env node
/**
 * 阶段一：契约发布 — Swagger JSON → YApi
 *
 * Usage:
 *   node scripts/yapi-publish.mjs --base-url URL --token TOKEN --file ./swagger.json [--merge merge]
 *   node scripts/yapi-publish.mjs --base-url URL --token TOKEN --url https://.../swagger.json
 */
import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { YApiClient } from './yapi-client.mjs'

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    token: { type: 'string' },
    file: { type: 'string' },
    url: { type: 'string' },
    merge: { type: 'string', default: 'merge' },
    'dry-run': { type: 'boolean', default: false },
  },
})

if (!values['base-url'] || !values.token) {
  console.error('Usage: yapi-publish.mjs --base-url URL --token TOKEN --file ./swagger.json')
  process.exit(1)
}

const client = new YApiClient(values['base-url'], values.token)

async function main() {
  // 获取 swagger 内容
  let swaggerJson
  if (values.file) {
    swaggerJson = readFileSync(values.file, 'utf-8')
  } else if (values.url) {
    const resp = await fetch(values.url)
    swaggerJson = await resp.text()
  } else {
    console.error('Either --file or --url is required')
    process.exit(1)
  }

  // 校验 JSON
  try {
    const parsed = JSON.parse(swaggerJson)
    const pathCount = Object.keys(parsed.paths || {}).length
    console.log(`📄 Swagger valid: ${parsed.info?.title || 'Untitled'} (${pathCount} paths)`)
  } catch (e) {
    console.error(`❌ Invalid JSON: ${e.message}`)
    process.exit(1)
  }

  if (values['dry-run']) {
    console.log('🔍 Dry-run mode — skipping publish')
    return
  }

  // 导入到 YApi
  console.log(`📤 Publishing to ${values['base-url']} (merge=${values.merge})...`)
  const result = await client.importData({
    type: 'swagger',
    merge: values.merge,
    json: swaggerJson,
  })

  if (result.errcode === 0) {
    console.log('✅ Publish successful!')
    if (result.data?.message) console.log(`   ${result.data.message}`)
  } else {
    console.error(`❌ Publish failed: ${result.errmsg}`)
    process.exit(1)
  }
}

main().catch((err) => { console.error(err.message); process.exit(1) })
