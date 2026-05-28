#!/usr/bin/env node
/**
 * YApi OpenAPI 统一客户端 — 封装 YApi 全部 11 个接口
 * 纯 Node.js 内置模块，零依赖。
 */
import { parseArgs } from 'node:util'

// ─── HTTP 请求封装 ───
async function request(method, baseUrl, path, { query = {}, body, formBody } = {}) {
  const url = new URL(path, baseUrl)
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))

  const opts = { method }
  if (formBody) {
    opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    opts.body = new URLSearchParams(formBody).toString()
  } else if (body) {
    opts.headers = { 'Content-Type': 'application/json' }
    opts.body = JSON.stringify(body)
  }

  const resp = await fetch(url.toString(), opts)
  const data = await resp.json()
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${JSON.stringify(data)}`)
  return data
}

// ─── YApiClient ───
export class YApiClient {
  constructor(baseUrl, token) {
    this.base = baseUrl.replace(/\/+$/, '')
    this.token = token
  }

  // 1. 项目信息
  projectGet() { return request('GET', this.base, '/api/project/get', { query: { token: this.token } }) }

  // 2. 新增分类
  catAdd(projectId, name, desc) {
    const b = { project_id: String(projectId), name, token: this.token }
    if (desc) b.desc = desc
    return request('POST', this.base, '/api/interface/add_cat', { formBody: b })
  }

  // 3. 分类菜单
  catMenu(projectId) {
    return request('GET', this.base, '/api/interface/getCatMenu', { query: { project_id: String(projectId), token: this.token } })
  }

  // 4. 数据导入
  importData({ type, merge, url, json }) {
    const b = { type, merge, token: this.token }
    if (url) b.url = url
    if (json) b.json = json
    return request('POST', this.base, '/api/open/import_data', { formBody: b })
  }

  // 5. 接口详情
  interfaceGet(id) {
    return request('GET', this.base, '/api/interface/get', { query: { id: String(id), token: this.token } })
  }

  // 6. 分类下接口列表
  catList(catid, page = 1, limit = 1000) {
    return request('GET', this.base, '/api/interface/list_cat', { query: { catid: String(catid), token: this.token, page: String(page), limit: String(limit) } })
  }

  // 7. 新增接口
  interfaceAdd(data) {
    return request('POST', this.base, '/api/interface/add', { body: { ...data, token: this.token } })
  }

  // 8. 新增或更新 (upsert)
  interfaceSave(data) {
    return request('POST', this.base, '/api/interface/save', { body: { ...data, token: this.token } })
  }

  // 9. 接口列表
  interfaceList(projectId, page = 1, limit = 1000) {
    return request('GET', this.base, '/api/interface/list', { query: { project_id: String(projectId), token: this.token, page: String(page), limit: String(limit) } })
  }

  // 10. 更新接口
  interfaceUp(data) {
    return request('POST', this.base, '/api/interface/up', { body: { ...data, token: this.token } })
  }

  // 11. 接口菜单（树形，含完整接口详情）
  listMenu(projectId) {
    return request('GET', this.base, '/api/interface/list_menu', { query: { project_id: String(projectId), token: this.token } })
  }
}

// ─── CLI 模式 ───
if (process.argv[1]?.includes('yapi-client.mjs')) {
  const { values } = parseArgs({
    options: {
      'base-url': { type: 'string' },
      token: { type: 'string' },
      command: { type: 'string' },
      'project-id': { type: 'string' },
      'interface-id': { type: 'string' },
      catid: { type: 'string' },
      name: { type: 'string' },
      desc: { type: 'string' },
      data: { type: 'string' },
      page: { type: 'string', default: '1' },
      limit: { type: 'string', default: '1000' },
    },
  })

  const client = new YApiClient(values['base-url'], values.token)
  const cmd = values.command

  try {
    let result
    switch (cmd) {
      case 'project-get': result = await client.projectGet(); break
      case 'cat-add': result = await client.catAdd(values['project-id'], values.name, values.desc); break
      case 'cat-menu': result = await client.catMenu(values['project-id']); break
      case 'get': result = await client.interfaceGet(values['interface-id']); break
      case 'cat-list': result = await client.catList(values.catid, +values.page, +values.limit); break
      case 'list': result = await client.interfaceList(values['project-id'], +values.page, +values.limit); break
      case 'list-menu': result = await client.listMenu(values['project-id']); break
      case 'add': result = await client.interfaceAdd(JSON.parse(values.data || '{}')); break
      case 'save': result = await client.interfaceSave(JSON.parse(values.data || '{}')); break
      case 'up': result = await client.interfaceUp(JSON.parse(values.data || '{}')); break
      default: console.error(`Unknown command: ${cmd}`); process.exit(1)
    }
    console.log(JSON.stringify(result, null, 2))
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }
}
