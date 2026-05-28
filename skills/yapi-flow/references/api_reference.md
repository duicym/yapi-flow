# YApi OpenAPI 完整接口参考

## 认证方式

YApi 开放 API 使用**项目 token** 进行认证。Token 在 YApi 项目「设置」→「token 配置」中获取。

所有请求须携带 `token` 参数，根据接口不同通过 Query 参数或 Body 参数传递。

## 通用返回格式

```json
{
  "errcode": 0,     // 0=成功
  "errmsg": "成功！",
  "data": { ... }    // 具体数据
}
```

## 接口列表

### 1. 获取项目基本信息

```
GET /api/project/get?token={token}
```

返回项目名称、描述等基本信息。

### 2. 新增接口分类

```
POST /api/interface/add_cat
Content-Type: application/x-www-form-urlencoded

name=分类名&project_id=123&token=xxx&desc=描述
```

### 3. 获取菜单列表

```
GET /api/interface/getCatMenu?project_id={id}&token={token}
```

返回按分类组织的接口树。

### 4. 服务端数据导入

```
POST /api/open/import_data
Content-Type: application/x-www-form-urlencoded

type=swagger&merge=normal&url=https://...&token=xxx
```

| 参数 | 必填 | 说明 |
|------|------|------|
| type | 是 | 导入类型（swagger 等） |
| merge | 是 | normal(普通) / good(智能合并) / merge(完全覆盖) |
| json | 否 | JSON 字符串数据 |
| url | 否 | 接口文档 URL |
| token | 是 | 项目 token |

### 5. 获取接口数据（含完整定义）

```
GET /api/interface/get?id={id}&token={token}
```

返回包含 req_query、req_headers、req_body_form、req_params、res_body 等完整字段的接口详情。

### 6. 获取分类下接口列表

```
GET /api/interface/list_cat?catid={id}&token={token}&page=1&limit=10
```

分页参数可用 limit=1000 跳过翻页。

### 7. 新增接口

```
POST /api/interface/add
Content-Type: application/json

{
  "token": "xxx",
  "title": "接口名称",
  "catid": "1376",
  "path": "/api/user/list",
  "method": "GET",
  "status": "undone",
  "res_body_type": "json",
  "res_body": "{}",
  "desc": "<p>描述</p>",
  "req_query": [],
  "req_headers": [],
  "req_body_form": [],
  "req_params": [],
  "switch_notice": false,
  "message": ""
}
```

### 8. 新增或更新接口（upsert）

```
POST /api/interface/save
Content-Type: application/json

{ ...same as add, plus "id": "4396" }
```

若 `id` 已存在则更新，否则新增。

### 9. 获取接口列表

```
GET /api/interface/list?project_id={id}&token={token}&page=1&limit=10
```

返回扁平列表（不含详细参数定义），用 limit=1000 获取全部。

### 10. 更新接口

```
POST /api/interface/up
Content-Type: application/json

{ ...same as save, must include "id" }
```

必须包含 `id` 字段指定目标接口。

### 11. 获取接口菜单列表

```
GET /api/interface/list_menu?project_id={id}&token={token}
```

返回树形菜单结构，每个分类下包含完整的接口详情。

## Content-Type 使用汇总

| Content-Type | 使用场景 |
|--------------|----------|
| `application/json` | add, save, up, get, list, list_menu |
| `application/x-www-form-urlencoded` | add_cat, import_data |

## 分页约定

- 参数: `page`(页码), `limit`(每页数量，默认10)
- 传 `limit=1000` 可跳过翻页获取全部数据
