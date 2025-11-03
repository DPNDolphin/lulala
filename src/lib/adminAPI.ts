// API工具函数，处理管理后台的认证请求

interface ApiResponse<T = any> {
  api_code: number
  api_msg: string
  data?: T
}

class AdminAPI {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('admin_token')
  }

  // ========== 空投管理相关 ==========
  async airdropsList(params?: Record<string, any>) {
    return this.get('/v1/airdrops/list', params)
  }

  async airdropDetail(id: number | string) {
    return this.get('/v1/airdrops/detail', { id })
  }

  async airdropCreate(data: any) {
    return this.post('/v1/airdrops/create', data)
  }

  async airdropUpdate(id: number | string, data: any) {
    return this.post('/v1/airdrops/update', { id, ...data })
  }

  async airdropDelete(id: number | string) {
    return this.post('/v1/airdrops/delete', { id })
  }

  // ========== 交易VIP日志相关 ==========
  async tradeVipLogsList(params?: Record<string, any>) {
    return this.get('/v1/admin/tradeVipLogs', params)
  }

  async tradeVipLogsStats(params?: Record<string, any>) {
    return this.get('/v1/admin/tradeVipLogs', { operation: 'stats', ...params })
  }

  async tradeVipLogsSystemStats(params?: Record<string, any>) {
    return this.get('/v1/admin/tradeVipLogs', { operation: 'system_stats', ...params })
  }

  private getHeaders(): Record<string, string> {
    const token = this.getToken()
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    if (token) {
      headers.Authorization = token
    }
    
    return headers
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json()
    
    // 如果token无效或过期，清除本地存储并跳转登录
    if (data.api_code === 401) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_token_expire')
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login'
      }
    }
    
    return data
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let fullUrl = url
    
    // 如果有查询参数，添加到URL中
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (url.includes('?') ? '&' : '?') + queryString
      }
    }
    
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<T>(response)
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    
    return this.handleResponse<T>(response)
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    })
    
    return this.handleResponse<T>(response)
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(),
    })
    
    return this.handleResponse<T>(response)
  }

  // 专门的登录方法，不需要token
  async login(username: string, password: string): Promise<ApiResponse<{
    token: string
    expire_time: number
  }>> {
    const response = await fetch('/v1/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
      credentials: 'include', // 确保携带cookie
    })
    
    return this.handleResponse(response)
  }
}

// 导出单例实例
export const adminAPI = new AdminAPI()

// 导出类型
export type { ApiResponse }