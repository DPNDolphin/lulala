// 空投项目相关API接口

import { publicAPI, type ApiResponse } from './publicAPI'

// 空投项目类型定义
export interface AirdropProject {
  id: number
  name: string
  icon: string
  website: string
  twitter_url: string
  linkedin_url: string
  whitepaper_url: string
  tags: string[]
  description: string
  content: string
  status: 'draft' | 'published' | 'archived'
  featured: number
  is_vip: number
  views: number
  participants: number
  likes: number
  comments_count: number
  favorites_count: number
  heat_7d: number
  heat_30d: number
  heat_90d: number
  heat_total: number
  created_by: number
  created_at: string
  updated_at: string
  publish_date: string
}

export interface AirdropDetail extends AirdropProject {
  user_interactions?: {
    is_liked: boolean
    is_favorited: boolean
    is_participated: boolean
  }
}

export interface AirdropComment {
  id: number
  target_id: number
  type: string
  user_id: number
  author?: string // 兼容旧格式
  content: string
  likes: number
  parent_id: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
  comment_time?: string // 兼容旧格式
  user?: {
    nickname: string
    avatar: string
  }
}

export interface HeatHistoryRecord {
  date: string
  daily_heat: number
  views: number
  participants: number
  likes: number
  comments: number
  favorites: number
}

// 空投API类
export class AirdropsAPI {
  // 获取空投项目列表
  async getAirdrops(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
    tag?: string
    sort?: string
    order?: string
    is_vip?: string
  }): Promise<ApiResponse<{
    airdrops: AirdropProject[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>> {
    return publicAPI.get('/v1/airdrops/list', params)
  }

  // 获取空投项目详情
  async getAirdropDetail(id: number): Promise<ApiResponse<{
    airdrop: AirdropProject
    user_interactions: {
      is_liked: boolean
      is_favorited: boolean
      is_participated: boolean
    }
  }>> {
    return publicAPI.get('/v1/airdrops/detail', { id })
  }

  // 参与空投项目
  async participateAirdrop(id: number, status?: string): Promise<ApiResponse<{
    status: string
  }>> {
    return publicAPI.post('/v1/airdrops/participate', { id, status })
  }

  // 点赞/取消点赞空投项目
  async likeAirdrop(id: number): Promise<ApiResponse<{
    is_liked: boolean
  }>> {
    return publicAPI.post('/v1/global/likes', { 
      target_id: id, 
      type: 'airdrop' 
    })
  }

  // 收藏/取消收藏空投项目
  async favoriteAirdrop(id: number): Promise<ApiResponse<{
    is_favorited: boolean
  }>> {
    return publicAPI.post('/v1/global/favorites', { 
      target_id: id, 
      type: 'airdrop' 
    })
  }

  // 评论空投项目
  async commentAirdrop(id: number, content: string, parent_id?: number): Promise<ApiResponse<{
    comment_id: number
  }>> {
    return publicAPI.post('/v1/research/comments?operation=create', { 
      target_id: id, 
      type: 'airdrop', 
      content, 
      parent_id 
    })
  }

  // 获取空投项目评论列表
  async getAirdropComments(id: number, params?: {
    page?: number
    limit?: number
    parent_id?: number
  }): Promise<ApiResponse<{
    comments: AirdropComment[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>> {
    return publicAPI.get('/v1/research/comments?operation=list', { 
      target_id: id, 
      type: 'airdrop', 
      ...params 
    })
  }

  // 获取空投项目历史热度数据
  async getAirdropHeatHistory(id: number, days?: number): Promise<ApiResponse<{
    heat_history: HeatHistoryRecord[]
    airdrop_id: number
    days: number
  }>> {
    return publicAPI.get('/v1/airdrops/heatHistory', { id, days })
  }
}

// 导出空投API实例
export const airdropsAPI = new AirdropsAPI()


