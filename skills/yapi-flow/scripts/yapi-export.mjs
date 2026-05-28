#!/usr/bin/env node
/**
 * 文档导出 — YApi → Markdown
 *
 * Usage:
 *   node scripts/yapi-export.mjs --base-url URL --token TOKEN --project-id 123 --output ./api-docs.md
 */
import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'
import { YApiClient } from './yapi-client.mjs'

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    token: { type: 'string' },
    'project-id': { type: 'string' },
    output: { type: 'string', default: 'api-docs.md' },
  },
})

const METHOD_BADGE = { GET: '🟢', POST: '🟠', PUT: '🔵', DELETE: '🔴', PATCH: '🟣' }

function escapeMd(t) { return (t || '').replace(/\|/g, '\\|').replace(/\n/g, '<br>') }
function stripHtml(t) { return (t || '').replace(/<[^>]+>/g, '').trim() }

function generateMarkdown(categories) {
  const lines = ['# API 接口文档', '', `> 由 YApi Flow 自动生成`, '', '---', '']
  const toc = ['## 目录', '']

  let idx = 0
  for (const cat of categories) {
    const apis = cat.list || []
    if (!apis.length) continue
    idx++
    const name = cat.name || '未分类'
    toc.push(`- [${idx}. ${name}](#${idx}-${encodeURI(name)})`)
    lines.push(`## ${idx}. ${name}`, '')
    if (cat.desc && cat.desc !== name) lines.push(`> ${escapeMd(cat.desc)}`, '')

    for (const [i, api] of apis.entries()) {
      const title = api.title || api.path || '未命名'
      const badge = METHOD_BADGE[api.method?.toUpperCase()] || '⚪'
      lines.push(`### ${idx}.${i + 1} ${badge} ${title}`, '')
      lines.push(`- **方法**: \`${api.method}\``)
      lines.push(`- **路径**: \`${api.path}\``)
      lines.push(`- **状态**: ${api.status || 'unknown'}`)

      const desc = stripHtml(api.desc)
      if (desc) lines.push(`- **描述**: ${desc}`)
      lines.push('')

      // 请求参数
      const headers = api.req_headers || []
      const query = api.req_query || []
      const bodyForm = api.req_body_form || []
      const pathParams = api.req_params || []

      if (headers.length || query.length || bodyForm.length || pathParams.length) {
        lines.push('**请求参数**:', '')

        if (headers.length) {
          lines.push('| 名称 | 类型 | 必填 | 说明 |')
          lines.push('|------|------|------|------|')
          for (const h of headers) lines.push(`| ${escapeMd(h.name)} | ${h.type || '-'} | ${h.required === '1' ? '是' : '否'} | ${escapeMd(h.desc || '-')} |`)
          lines.push('')
        }
        if (query.length) {
          lines.push('| 名称 | 类型 | 必填 | 说明 |')
          lines.push('|------|------|------|------|')
          for (const q of query) lines.push(`| ${escapeMd(q.name)} | ${q.type || '-'} | ${q.required === '1' ? '是' : '否'} | ${escapeMd(q.desc || '-')} |`)
          lines.push('')
        }
        if (bodyForm.length) {
          lines.push('| 名称 | 类型 | 必填 | 说明 |')
          lines.push('|------|------|------|------|')
          for (const f of bodyForm) lines.push(`| ${escapeMd(f.name)} | ${f.type || '-'} | ${f.required === '1' ? '是' : '否'} | ${escapeMd(f.desc || '-')} |`)
          lines.push('')
        }
      }

      // 响应示例
      if (api.res_body) {
        try {
          const formatted = JSON.stringify(JSON.parse(api.res_body), null, 2)
          lines.push('**响应示例**:', '', '```json', formatted, '```', '')
        } catch {
          lines.push('**响应示例**:', '', '```', api.res_body, '```', '')
        }
      }

      lines.push('---', '')
    }
  }

  const titleEnd = lines.indexOf('---') + 1
  return [...lines.slice(0, titleEnd), ...toc, '', '---', '', ...lines.slice(titleEnd)].join('\n')
}

async function main() {
  if (!values['base-url'] || !values.token || !values['project-id']) {
    console.error('Usage: yapi-export.mjs --base-url URL --token TOKEN --project-id ID')
    process.exit(1)
  }

  const client = new YApiClient(values['base-url'], values.token)
  console.log('📡 Fetching interface data...')
  const result = await client.listMenu(values['project-id'])

  if (result.errcode !== 0) {
    console.error(`❌ YApi error: ${result.errmsg}`)
    process.exit(1)
  }

  const categories = result.data || []
  const total = categories.reduce((s, c) => s + (c.list?.length || 0), 0)
  console.log(`📋 ${total} interfaces in ${categories.length} categories`)

  const markdown = generateMarkdown(categories)
  writeFileSync(values.output, markdown, 'utf-8')
  console.log(`✅ Exported to ${values.output}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })
