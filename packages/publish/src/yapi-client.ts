import type {
  YApiCategory,
  YApiImportParams,
  YApiImportResult,
  YApiInterface,
  YApiResponse,
} from '@yapi-flow/shared'

export class YApiClient {
  private baseUrl: string
  private token: string

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, '')
    this.token = token
  }

  /** GET /api/project/get */
  async projectGet(): Promise<YApiResponse> {
    return this.get('/api/project/get', { token: this.token })
  }

  /** POST /api/interface/add_cat */
  async catAdd(
    projectId: number,
    name: string,
    desc?: string,
  ): Promise<YApiResponse> {
    const body: Record<string, string> = {
      project_id: String(projectId),
      name,
      token: this.token,
    }
    if (desc !== undefined) {
      body.desc = desc
    }
    return this.postForm('/api/interface/add_cat', body)
  }

  /** GET /api/interface/getCatMenu */
  async catMenu(projectId: number): Promise<YApiResponse<YApiCategory[]>> {
    return this.get('/api/interface/getCatMenu', {
      project_id: String(projectId),
      token: this.token,
    })
  }

  /** POST /api/open/import_data */
  async importData(params: YApiImportParams): Promise<YApiImportResult> {
    const body: Record<string, string> = {
      type: params.type,
      merge: params.merge,
      token: this.token,
    }
    if (params.url !== undefined) {
      body.url = params.url
    }
    if (params.json !== undefined) {
      body.json = params.json
    }
    return this.postForm('/api/open/import_data', body)
  }

  /** GET /api/interface/get */
  async interfaceGet(id: number): Promise<YApiResponse<YApiInterface>> {
    return this.get('/api/interface/get', {
      id: String(id),
      token: this.token,
    })
  }

  /** GET /api/interface/list_cat */
  async catList(
    catid: number,
    page?: number,
    limit?: number,
  ): Promise<YApiResponse> {
    const params: Record<string, string> = {
      catid: String(catid),
      token: this.token,
    }
    if (page !== undefined) {
      params.page = String(page)
    }
    if (limit !== undefined) {
      params.limit = String(limit)
    }
    return this.get('/api/interface/list_cat', params)
  }

  /** POST /api/interface/add */
  async interfaceAdd(data: any): Promise<YApiResponse> {
    return this.postJson('/api/interface/add', { ...data, token: this.token })
  }

  /** POST /api/interface/save */
  async interfaceSave(data: any): Promise<YApiResponse> {
    return this.postJson('/api/interface/save', { ...data, token: this.token })
  }

  /** GET /api/interface/list */
  async interfaceList(
    projectId: number,
    page?: number,
    limit?: number,
  ): Promise<YApiResponse<YApiInterface[]>> {
    const params: Record<string, string> = {
      project_id: String(projectId),
      token: this.token,
    }
    if (page !== undefined) {
      params.page = String(page)
    }
    if (limit !== undefined) {
      params.limit = String(limit)
    }
    return this.get('/api/interface/list', params)
  }

  /** POST /api/interface/up */
  async interfaceUp(data: any): Promise<YApiResponse> {
    return this.postJson('/api/interface/up', { ...data, token: this.token })
  }

  /** GET /api/interface/list_menu */
  async listMenu(projectId: number): Promise<YApiResponse<YApiCategory[]>> {
    return this.get('/api/interface/list_menu', {
      project_id: String(projectId),
      token: this.token,
    })
  }

  // --- Private helpers ---

  private async get<T = any>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    const response = await fetch(url.toString(), { method: 'GET' })

    if (!response.ok) {
      throw new Error(
        `YApi GET ${path} failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.json() as T
  }

  private async postForm<T = any>(
    path: string,
    body: Record<string, string>,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)
    const formBody = new URLSearchParams(body)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formBody.toString(),
    })

    if (!response.ok) {
      throw new Error(
        `YApi POST ${path} failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.json() as T
  }

  private async postJson<T = any>(
    path: string,
    body: any,
  ): Promise<T> {
    const url = new URL(path, this.baseUrl)

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(
        `YApi POST ${path} failed: ${response.status} ${response.statusText}`,
      )
    }

    return response.json() as T
  }
}
