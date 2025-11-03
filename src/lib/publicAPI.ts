// 公共API工具函数，处理不需要认证的请求

interface ApiResponse<T = any> {
  api_code: number
  api_msg: string
  data?: T
}

class PublicAPI {
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json()
    return data
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE
    let fullUrl = apiBase ? (url.startsWith('http') ? url : `${apiBase}${url}`) : url
    
    // 处理查询参数
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
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 携带cookie
    })
    
    return this.handleResponse<T>(response)
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    console.log('🌐 PublicAPI POST 请求:', { url, data })
    
    // 对于评论API，使用FormData格式
    let body: string | FormData
    let headers: Record<string, string> = {}
    
    if (url.includes('/comments')) {
      // 评论API使用FormData
      const formData = new FormData()
      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value))
          }
        })
      }
      body = formData
      console.log('📝 使用 FormData 格式')
    } else {
      // 其他API使用JSON
      headers['Content-Type'] = 'application/json'
      body = data ? JSON.stringify(data) : ''
      console.log('📄 使用 JSON 格式，Body 长度:', body.length)
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE
    const fullUrl = apiBase ? (url.startsWith('http') ? url : `${apiBase}${url}`) : url
    console.log('📤 发送请求到:', fullUrl)
    console.log('📋 请求头:', headers)
    
    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers,
        body,
        credentials: 'include', // 携带cookie
      })
      
      console.log('📥 收到响应:', { 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })
      
      const result = await this.handleResponse<T>(response)
      console.log('✅ 响应处理完成:', result)
      return result
    } catch (error) {
      console.error('💥 请求失败:', error)
      throw error
    }
  }
}

// 导出单例实例
export const publicAPI = new PublicAPI()

// 导出类型
export type { ApiResponse }

// 新闻相关接口类型
export interface NewsArticle {
  id: number
  title: string
  excerpt: string
  category: string
  image: string
  video_url?: string
  author: string
  read_time: string
  views: number
  featured: number
  published_at: string
}

export interface NewbieArticle {
  id: number
  title: string
  excerpt: string
  category: string
  image: string
  video_url?: string
  author: string
  read_time: string
  views: number
  featured: number
  published_at: string
  section: 'guide' | 'toolkit' | 'exchanges'
}

// 扩展 PublicAPI 类，添加新闻相关方法
export class NewsAPI extends PublicAPI {
  // 获取新手村文章
  async getNewbieArticles(section?: 'guide' | 'toolkit' | 'exchanges'): Promise<ApiResponse<NewbieArticle[]>> {
    const params: Record<string, any> = {
      category_type: 'newbie',
      limit: 10
    }
    
    if (section) {
      params.section = section
    }
    
    const response = await this.get<{articles: NewbieArticle[]}>('/v1/news/list', params)
    //if (response.api_code == 200) {
      return {
        ...response,
        data: response.data?.articles || []
      }
    //}
    //return response as ApiResponse<NewbieArticle[]>
  }

  // 获取最新资讯
  async getLatestNews(limit: number = 6): Promise<ApiResponse<NewsArticle[]>> {
    const response = await this.get<{articles: NewsArticle[]}>('/v1/news/list', {
      category_type: 'news',
      limit: limit.toString()
    })
    //if (response.api_code == 200) {
      return {
        ...response,
        data: response.data?.articles || []
      }
    //}
    //return response as ApiResponse<NewsArticle[]>
  }

  // 获取头条新闻
  async getFeaturedNews(): Promise<ApiResponse<NewsArticle>> {
    return this.get<NewsArticle>('/v1/news/public', {
      operation: 'featured'
    })
  }
}

// 导出新闻API实例
export const newsAPI = new NewsAPI()

// 用户个人数据相关接口类型
export interface ResearchActivity {
  id: string
  reportId: number
  reportTitle: string
  action: 'participate' | 'like' | 'bookmark' | 'comment'
  timestamp: string
  content?: string
}

export interface AirdropRecord {
  id: string
  airdropId: number
  projectName: string
  amount: string
  token: string
  status: 'participated' | 'completed' | 'claimed'
  timestamp: string
  txHash?: string
}

export interface AirdropActivity {
  id: string
  airdropId: number
  airdropTitle: string
  action: 'participate' | 'like' | 'bookmark' | 'comment'
  timestamp: string
  status?: 'participated' | 'completed' | 'claimed'
  content?: string
}

export interface InviteRecord {
  id: string
  inviteeAddress: string
  inviteeName?: string
  isPaid: boolean
  joinDate: string
  rewardAmount?: string
}

export interface ResearchStats {
  participate: number
  like: number
  bookmark: number
}

export interface AirdropStats {
  total: number
  completed: number
  claimed: number
  participating: number
}

export interface InviteStats {
  total: number
  paid: number
  total_reward: number
}

// 用户邀请（联盟）信息接口类型
export interface UnionInfoPerson {
  userid: number
  nickname?: string
  avatar?: string
  viplevel?: number
  vip_vailddate?: string
  tradelevel?: number
  trade_vailddate?: string
}

export interface UnionInfoResponse {
  people_num: number           // 直接邀请人数
  people_vip_num: number       // 直接邀请的VIP人数
  tree_people_num: number      // 整个邀请树总人数
  tree_people_vip_num: number  // 整个邀请树VIP人数
  people_list: UnionInfoPerson[]
  page?: number
  limit?: number
  total_pages?: number
}

// 用户个人数据API类
export class UserDataAPI extends PublicAPI {
  // 获取用户投研活动记录
  async getResearchActivities(activityType?: 'participate' | 'like' | 'bookmark' | 'comment', page: number = 1, limit: number = 20): Promise<ApiResponse<{total: number, page: number, limit: number, activities: ResearchActivity[]}>> {
    const params: Record<string, any> = {
      operation: 'list',
      page,
      limit
    }
    
    if (activityType) {
      params.activity_type = activityType
    }
    
    return this.get('/v1/users/researchactivities', params)
  }

  // 获取用户投研活动统计
  async getResearchStats(): Promise<ApiResponse<ResearchStats>> {
    return this.get('/v1/users/researchactivities', {
      operation: 'stats'
    })
  }

  // 获取用户空投参与记录
  async getAirdropRecords(page: number = 1, limit: number = 20): Promise<ApiResponse<{total: number, page: number, limit: number, records: AirdropRecord[]}>> {
    return this.get('/v1/users/airdroprecords', {
      operation: 'list',
      page,
      limit
    })
  }

  // 获取用户空投参与统计
  async getAirdropStats(): Promise<ApiResponse<AirdropStats>> {
    return this.get('/v1/users/airdroprecords', {
      operation: 'stats'
    })
  }

  // 获取用户空投活动记录
  async getAirdropActivities(activityType?: 'participate' | 'like' | 'bookmark' | 'comment', page: number = 1, limit: number = 20): Promise<ApiResponse<{total: number, page: number, limit: number, activities: AirdropActivity[]}>> {
    const params: Record<string, any> = {
      operation: 'list',
      page,
      limit
    }
    
    if (activityType) {
      params.activity_type = activityType
    }
    
    return this.get('/v1/users/airdropactivities', params)
  }

  // 获取用户空投活动统计
  async getAirdropActivityStats(): Promise<ApiResponse<ResearchStats>> {
    return this.get('/v1/users/airdropactivities', {
      operation: 'stats'
    })
  }

  // 注意：getInviteRecords 和 getInviteStats 已被 getUnionInfo 替代
  // 保留这些方法以防其他地方使用，但建议使用 getUnionInfo

  // 生成邀请链接
  async generateInviteLink(): Promise<ApiResponse<{invite_link: string, qr_code_url: string}>> {
    return this.get('/v1/users/unionInfo', {
      operation: 'generate_link'
    })
  }

  // 获取用户邀请（联盟）信息（支持分页）
  async getUnionInfo(page: number = 1, limit: number = 20): Promise<ApiResponse<UnionInfoResponse>> {
    return this.get('/v1/users/unionInfo', { page, limit })
  }

  // 给邀请用户设置交易VIP
  async grantTradeVip(targetUserId: number, tradeDays: number = 365): Promise<ApiResponse<any>> {
    return this.post('/v1/users/unionInfo', {
      operation: 'grant_trade_vip',
      target_userid: targetUserId,
      trade_days: tradeDays
    })
  }
}

// 导出用户数据API实例
export const userDataAPI = new UserDataAPI()

// 用户资料相关接口类型
export interface UserProfile {
  nickname: string
  avatar: string
}

export interface UserProfileData {
  id: number
  wallet_address: string
  email?: string
  nickname: string
  avatar: string
  vip_level?: number
  vip_vailddate?: number | string
  trade_level?: number
  trade_vailddate?: number | string
  balance?: number
  point?: number
  usertype?: number
  invite_reward?: number
  likes_count?: number
  comments_count?: number
  project_participation_count?: number
}

// 用户资料API类
export class UserProfileAPI extends PublicAPI {
  // 保存用户资料
  async saveUserProfile(profile: UserProfile): Promise<ApiResponse<any>> {
    const data = await this.post('/v1/users/profile', {
      operation: 'update',
      nickname: profile.nickname,
      avatar: profile.avatar
    })
    
    if (data.api_code !== 200) {
      throw new Error(data.api_msg || '保存失败')
    }
    
    return data
  }

  // 获取用户资料（包含余额 balance）
  async getUserProfile(): Promise<ApiResponse<UserProfileData>> {
    return this.post('/v1/users/profile', {
      operation: 'get'
    })
  }
}

// 导出用户资料API实例
export const userProfileAPI = new UserProfileAPI()

// 积分日志相关接口类型
export interface PointLog {
  id: number
  user_id: number
  point_change: number
  point_before: number
  point_after: number
  action_type: string
  action_name: string
  related_id: number | null
  related_type: string
  description: string
  created_at: string
}

export interface PointLogResponse {
  logs: PointLog[]
  current_point: number
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

// 积分日志API类
export class PointLogAPI extends PublicAPI {
  // 获取积分日志列表
  async getPointLogs(page: number = 1, limit: number = 20, action_type?: string): Promise<ApiResponse<PointLogResponse>> {
    const params: any = { page, limit }
    if (action_type) {
      params.action_type = action_type
    }
    return this.get('/v1/users/pointLog', params)
  }
}

// 导出积分日志API实例
export const pointLogAPI = new PointLogAPI()
