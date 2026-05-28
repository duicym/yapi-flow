/**
 * YApi 接口数据类型定义
 */

/** YApi 通用 API 响应 */
export interface YApiResponse<T = any> {
  errcode: number
  errmsg: string
  data: T
}

/** YApi 项目基本信息 */
export interface YApiProject {
  _id: number
  name: string
  desc: string
  basepath: string
  uid: number
  group_id: number
  icon: string
  color: string
  add_time: number
  up_time: number
}

/** YApi 接口分类 */
export interface YApiCategory {
  _id: number
  name: string
  project_id: number
  desc: string
  uid: number
  add_time: number
  up_time: number
  /** 分类下的接口列表（仅 list_menu 返回） */
  list?: YApiInterface[]
}

/** YApi 请求/响应参数 */
export interface YApiParam {
  name: string
  type?: string
  example?: string
  desc?: string
  required?: string
}

/** YApi 接口定义 */
export interface YApiInterface {
  _id: number
  project_id: number
  catid: number
  title: string
  path: string
  method: string
  desc?: string
  status: string
  uid: number
  add_time: number
  up_time: number
  edit_uid?: number
  req_body_type?: string
  req_body_form?: YApiParam[]
  req_headers?: YApiParam[]
  req_params?: YApiParam[]
  req_query?: YApiParam[]
  res_body?: string
  res_body_type?: string
  res_body_is_json_schema?: boolean
  switch_notice?: boolean
  message?: string
  tag?: string[]
}

/** YApi 接口创建/更新参数 */
export interface YApiInterfaceInput {
  token?: string
  id?: number | string
  title: string
  catid: number | string
  path: string
  method: string
  status?: string
  desc?: string
  req_body_type?: string
  req_body_form?: YApiParam[]
  req_headers?: YApiParam[]
  req_params?: YApiParam[]
  req_query?: YApiParam[]
  res_body?: string
  res_body_type?: string
  switch_notice?: boolean
  message?: string
}

/** YApi 导入参数 */
export interface YApiImportParams {
  type: string
  merge: 'normal' | 'good' | 'merge'
  url?: string
  json?: string
}

/** YApi 导入结果 */
export interface YApiImportResult {
  errcode: number
  errmsg: string
  data?: {
    message?: string
  }
}
