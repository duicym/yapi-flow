#!/usr/bin/env node
/**
 * 接口质量检查 — 扫描 YApi 项目接口规范性
 *
 * Usage:
 *   node scripts/yapi-check.mjs --base-url URL --token TOKEN --project-id 123
 */
import { parseArgs } from 'node:util'
import { YApiClient } from './yapi-client.mjs'

const { values } = parseArgs({
  options: {
    'base-url': { type: 'string' },
    token: { type: 'string' },
    'project-id': { type: 'string' },
    json: { type: 'boolean', default: false },
  },
})

function stripHtml(t) { return (t || '').replace(/<[^>]+>/g, '').trim() }
const VALID_METHODS = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'])

function checkInterface(api, catName) {
  const issues = []
  const { _id, title, path, method, status, desc, res_body, req_headers, req_query, req_body_form, req_params } = api
  const label = title || path || `#${_id}`

  // 错误级
  if (method && !VALID_METHODS.has(method.toUpperCase())) {
    issues.push({ level: 'error', msg: `HTTP 方法 '${method}' 不在标准列表中` })
  }
  if (path && !path.startsWith('/')) {
    issues.push({ level: 'error', msg: `路径缺少前导 '/'` })
  }
  if (res_body) {
    try { JSON.parse(res_body) } catch {
      issues.push({ level: 'error', msg: '响应示例不是有效 JSON' })
    }
  }

  // 警告级
  if (!stripHtml(desc)) issues.push({ level: 'warning', msg: '缺少接口描述' })
  if (status === 'undone') issues.push({ level: 'warning', msg: '接口状态为 undone' })
  if (!res_body) issues.push({ level: 'warning', msg: '缺少响应示例' })
  if (method && method !== method.toUpperCase()) issues.push({ level: 'warning', msg: `方法应大写: '${method}'` })

  // 提示级
  if (title === path) issues.push({ level: 'info', msg: '标题与路径相同，建议添加中文描述' })
  for (const f of (req_body_form || [])) {
    if (!f.type) issues.push({ level: 'info', msg: `参数 '${f.name}' 缺少类型定义` })
    if (!f.desc) issues.push({ level: 'info', msg: `参数 '${f.name}' 缺少描述` })
  }
  if (['POST', 'PUT', 'PATCH'].includes(method?.toUpperCase()) && !(req_body_form || []).length) {
    issues.push({ level: 'info', msg: `${method} 接口未定义请求体参数` })
  }

  return issues.map(i => ({ ...i, id: _id, title: label, category: catName }))
}

async function main() {
  if (!values['base-url'] || !values.token || !values['project-id']) {
    console.error('Usage: yapi-check.mjs --base-url URL --token TOKEN --project-id ID')
    process.exit(1)
  }

  const client = new YApiClient(values['base-url'], values.token)
  console.log('🔍 Scanning interfaces...')
  const result = await client.listMenu(values['project-id'])

  if (result.errcode !== 0) {
    console.error(`❌ YApi error: ${result.errmsg}`)
    process.exit(1)
  }

  const categories = result.data || []
  let total = 0
  const allIssues = []

  for (const cat of categories) {
    for (const api of (cat.list || [])) {
      total++
      const issues = checkInterface(api, cat.name)
      allIssues.push(...issues)
    }
  }

  const errors = allIssues.filter(i => i.level === 'error')
  const warnings = allIssues.filter(i => i.level === 'warning')
  const infos = allIssues.filter(i => i.level === 'info')
  const score = Math.max(0, 100 - errors.length * 10 - warnings.length * 5 - infos.length * 1)
  const rating = score >= 90 ? '⭐⭐⭐ 优秀' : score >= 70 ? '⭐⭐ 良好' : score >= 50 ? '⭐ 待改进' : '❌ 需要大量改进'

  if (values.json) {
    console.log(JSON.stringify({ total, score, rating, errors: errors.length, warnings: warnings.length, infos: infos.length, issues: allIssues }, null, 2))
    return
  }

  console.log('='.repeat(60))
  console.log('  YApi 接口规范质量检查')
  console.log('='.repeat(60))
  console.log(`  总接口数: ${total}`)
  console.log(`  质量得分: ${score}/100`)
  console.log(`  评级:     ${rating}`)
  console.log(`  🔴 错误: ${errors.length}  🟡 警告: ${warnings.length}  🔵 提示: ${infos.length}`)
  console.log('')

  if (!allIssues.length) {
    console.log('  🎉 未发现任何问题！')
    return
  }

  const emoji = { error: '🔴', warning: '🟡', info: '🔵' }
  for (const level of ['error', 'warning', 'info']) {
    const items = allIssues.filter(i => i.level === level)
    if (!items.length) continue
    for (const issue of items) {
      console.log(`  ${emoji[level]} [${issue.category}] ${issue.title}`)
      console.log(`     ${issue.msg}`)
    }
  }

  if (score < 100) process.exit(1)
}

main().catch(err => { console.error(err.message); process.exit(1) })
