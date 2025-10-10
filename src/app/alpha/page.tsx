'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import UserProfileModal from '@/components/UserProfileModal'
import { Search, Filter, Star, Calendar, X, Heart, MessageCircle, Send, Eye, TrendingUp, CheckCircle, Rocket, Reply, Bookmark, Award, User, Clock, BarChart3 } from 'lucide-react'
import ResearchCard from '@/components/ResearchCard'
import AirdropCard from '@/components/AirdropCard'
import StabilityBoard from '@/components/StabilityBoard'
import { publicAPI, userProfileAPI } from '@/lib/publicAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ResearchDetailModal from '@/components/ResearchDetailModal'

interface Comment {
  id: string
  content: string
  timestamp: string
  likes: number
  parent_id: number
  user: {
    nickname: string
    avatar: string
  }
  replies?: Comment[]
}

interface AlphaTask {
  id: number
  title: string
  description: string
  author: string
  publish_date: string
  rating: number
  views: number
  likes: number
  comments_count: number
  tags: string[]
  content: string
  icon: string
  video_url?: string
  status: string
  featured: number
  isLiked?: boolean
  isFavorited?: boolean
  commentsList?: Comment[]
  // 为了兼容ResearchCard组件，添加这些字段
  comments?: number
  images?: string[]
}

interface AirdropData {
  id: string
  token: string
  name: string
  timestamp: string
  time: string
  points: string
  type: string
  phase: string
  language: string
  status: string
  pretge: string
  bctge: string
  futures_listed: string
  amount: string
  created_timestamp: string
  updated_timestamp: string
  system_timestamp: string
  completed: string
  has_homonym: string
  spot_listed: string
  contract_address: string
  chain_id: string
  target_bnb: string | null
  actual_bnb: string | null
  collection_address: string | null
  tge_total: string | null
  utc: string | null
  data_hash: string
  created_at: string
  updated_at: string
}

interface AirdropsResponse {
  api_code: number
  api_msg: string
  airdrop_today: AirdropData[]
  airdrop_preview: AirdropData[]
}

export default function AlphaPage() {
  const { isAuthenticated, user, refreshAuth } = useMultiAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alphaTasks, setAlphaTasks] = useState<AlphaTask[]>([])
  const [selectedTask, setSelectedTask] = useState<AlphaTask | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'alpha' | 'booster' | 'stability'>('alpha')
  
  // 空投数据状态
  const [airdropToday, setAirdropToday] = useState<AirdropData[]>([])
  const [airdropPreview, setAirdropPreview] = useState<AirdropData[]>([])
  const [airdropLoading, setAirdropLoading] = useState(false)



  // 保存用户资料
  const saveUserProfile = async (profileData: any) => {
    try {
      await userProfileAPI.saveUserProfile({
        nickname: profileData.nickname,
        avatar: profileData.avatar
      })
      setUserProfile(profileData)
      // 刷新全局用户状态以更新侧边栏等地方的头像昵称
      await refreshAuth()
      setShowProfileModal(false)
      console.log('✅ Alpha页面用户资料保存成功，状态已刷新')
      return true
    } catch (error) {
      console.error('保存用户资料失败:', error)
      return false
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // 如果用户已认证且为VIP，加载对应标签页数据
    if (isAuthenticated && user?.vip_level && user.vip_level > 0) {
      if (activeTab === 'alpha') {
        loadAirdrops()
      } else if (activeTab === 'stability') {
        // 稳定度看板数据由组件自己加载
      } else {
        loadTasksForActiveTab()
      }
    }
  }, [isAuthenticated, user])

  // 切换 Tab 时重新加载数据
  useEffect(() => {
    if (!(isAuthenticated && user?.vip_level && user.vip_level > 0)) return
    
    if (activeTab === 'alpha') {
      loadAirdrops()
    } else if (activeTab === 'stability') {
      // 稳定度看板数据由组件自己加载
    } else {
      loadTasksForActiveTab()
    }
    
    // 重置筛选
    setSearchTerm('')
    setSelectedTag('')
  }, [activeTab])

  // 通过 URL 参数自动打开详情弹窗，例如 /alpha?id=123（需VIP权限）
  useEffect(() => {
    if (!mounted) return
    if (!(isAuthenticated && user?.vip_level && user.vip_level > 0)) return
    const idParam = searchParams?.get('id')
    if (idParam) {
      const reportId = parseInt(idParam, 10)
      if (!Number.isNaN(reportId)) {
        fetchTaskDetail(reportId)
      }
    }
  }, [mounted, searchParams, isAuthenticated, user])

  // 加载空投数据
  const loadAirdrops = async () => {
    console.log('开始加载空投数据')
    
    setAirdropLoading(true)
    try {
      const response = await publicAPI.get('/v1/research/airdrops')
      const data = response as AirdropsResponse
      
      console.log('空投API响应:', data)
      
      if (data.api_code == 200) {
        setAirdropToday(data.airdrop_today || [])
        setAirdropPreview(data.airdrop_preview || [])
        console.log('空投数据加载成功，今日:', data.airdrop_today?.length || 0, '预告:', data.airdrop_preview?.length || 0)
      } else {
        console.error('空投API返回错误:', data.api_msg)
      }
    } catch (error) {
      console.error('加载空投数据失败:', error)
    } finally {
      setAirdropLoading(false)
    }
  }

  // 加载当前标签页任务数据（Alpha 预告 / Booster 教程）
  const loadTasksForActiveTab = async () => {
    const categoryParam = activeTab === 'booster' ? 'alpha_booster' : 'alpha_airdrop'
    console.log('开始加载任务数据，category:', categoryParam)
    
    setLoading(true)
    try {
      const data = await publicAPI.get('/v1/research/listPublic', {
        category: categoryParam
      })
      
      console.log('任务API响应:', data)
      
      if (data.api_code == 200) {
        setAlphaTasks(data.data.reports || [])
        
        // 提取所有标签（确保为 string[]）
        const tagsSet = new Set<string>()
        ;(data.data.reports || []).forEach((task: AlphaTask) => {
          (task.tags || []).forEach((tag) => {
            if (typeof tag === 'string') tagsSet.add(tag)
          })
        })
        setTags(Array.from(tagsSet))
        console.log('任务加载成功，数量:', data.data.reports?.length || 0)
      } else {
        console.error('任务API返回错误:', data.api_msg)
      }
    } catch (error) {
      console.error('加载任务失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取任务详情
  const fetchTaskDetail = async (taskId: number) => {
    try {
      const data = await publicAPI.get('/v1/research/detail', { id: taskId })
      
      if (data.api_code == 200 && data.data) {
        const detail = data.data
        const task: AlphaTask = {
          id: detail.id,
          title: detail.title,
          description: detail.description,
          author: detail.author,
          publish_date: detail.publish_date,
          rating: detail.rating,
          views: detail.views,
          likes: detail.likes,
          comments_count: detail.comments_count,
          tags: detail.tags || [],
          content: detail.content,
          icon: detail.icon,
          video_url: detail.video_url,
          status: detail.status,
          featured: detail.featured,
          // 兼容 ResearchCard
          comments: detail.comments_count,
          images: []
        }

        // 并行检查点赞、收藏状态与评论列表
        const tasks: Promise<any>[] = []
        if (isAuthenticated) {
          tasks.push(
            publicAPI.post('/v1/global/likes', {
              target_id: taskId,
              type: 'research',
              operation: 'check'
            }).catch(() => ({ api_code: 200, data: { is_liked: false } }))
          )
          tasks.push(
            publicAPI.post('/v1/global/favorites', {
              target_id: taskId,
              type: 'research',
              operation: 'check'
            }).catch(() => ({ api_code: 200, data: { is_favorited: false } }))
          )
        }
        // 获取评论列表
        tasks.push(
          publicAPI.get('/v1/research/comments?operation=list', {
            report_id: taskId,
            type: 'research',
            page: 1,
            limit: 50
          }).catch(() => ({ api_code: 200, data: { comments: [] } }))
        )

        const results = await Promise.all(tasks)

        // 解析结果
        let likeRes: any | undefined
        let favRes: any | undefined
        let commentsRes: any | undefined

        if (isAuthenticated) {
          likeRes = results[0]
          favRes = results[1]
          commentsRes = results[2]
        } else {
          commentsRes = results[0]
        }

        task.isLiked = likeRes?.api_code == 200 ? likeRes.data.is_liked : false
        task.isFavorited = favRes?.api_code == 200 ? favRes.data.is_favorited : false

        if (commentsRes?.api_code == 200 && commentsRes.data?.comments) {
          task.commentsList = (commentsRes.data.comments || []).map((comment: any) => ({
            id: String(comment.id),
            content: comment.content,
            timestamp: new Date(comment.created_at).toISOString(),
            likes: comment.likes,
            parent_id: comment.parent_id,
            user: {
              nickname: comment.user?.nickname || '匿名用户',
              avatar: comment.user?.avatar || ''
            }
          }))
        }

        setSelectedTask(task)
        setShowDetailModal(true)
      }
    } catch (error) {
      console.error('获取任务详情失败:', error)
    }
  }

  // 处理评论
  const handleComment = async () => {
    if (!selectedTask || !newComment.trim()) return
    
    // 检查用户信息是否完整
    if (!userProfile || !userProfile.nickname || 
        userProfile.nickname.startsWith('Wallet_') || 
        !userProfile.avatar) {
      setShowProfileModal(true)
      return
    }
    
    setSubmittingComment(true)
    try {
      const data = await publicAPI.post('/v1/research/comments', {
        report_id: selectedTask.id,
        content: newComment.trim(),
        // 移除wallet_address参数，后端会根据用户认证状态自动识别用户
      })
      
      if (data.api_code == 200) {
        setNewComment('')
        // 重新获取任务详情以更新评论
        await fetchTaskDetail(selectedTask.id)
      } else {
        alert(data.api_msg || '评论发布失败')
      }
    } catch (error) {
      console.error('发布评论失败:', error)
      alert('评论发布失败，请重试')
    } finally {
      setSubmittingComment(false)
    }
  }

  // 过滤任务
  const filteredTasks = alphaTasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTag = !selectedTag || (task.tags && task.tags.includes(selectedTag))
    
    return matchesSearch && matchesTag
  })

  // 防止水合错误
  if (!mounted) {
    return (
      <div className="min-h-screen relative">
        {/* 固定背景图片 */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/alpha_bg.png)',
            zIndex: -1
          }}
        />
        
      
        <div className="relative z-10 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 判断用户是否为VIP
  const isUserVip = user?.vip_level ? user.vip_level > 0 : false


  return (
    <div className="min-h-screen relative">
      {/* 固定背景图片 */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/alpha_bg.png)',
          zIndex: -1
        }}
      />
      
 
      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="h-8 w-8 text-pink-400" />
              <h1 className="text-3xl font-bold text-white">币安Alpha专区</h1>
              <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                VIP
              </div>
            </div>
            <p className="text-gray-300">
              发现最新的Alpha任务和Booster教程，把握早期机会
            </p>
          </div>

          {/* Tab导航 */}
          <div className="flex space-x-1 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('alpha')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'alpha'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>币安Alpha预告</span>
            </button>
            <button
              onClick={() => setActiveTab('stability')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'stability'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>稳定度看板</span>
            </button>
            <button
              onClick={() => setActiveTab('booster')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'booster'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Star className="h-4 w-4" />
              <span>币安Booster教程</span>
            </button>
          </div>

          {/* 内容区域 */}
          {!isAuthenticated ? (
            // 未登录用户显示登录提示
            <div className="text-center py-20">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-4">
                  {activeTab === 'alpha' ? '币安Alpha预告' : activeTab === 'stability' ? '稳定度看板' : '币安Booster教程'}
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  {activeTab === 'alpha' 
                    ? '请先登录以查看Alpha任务'
                    : activeTab === 'stability'
                    ? '请先登录以查看代币稳定度数据'
                    : '请先登录以查看Booster教程'
                  }
                </p>
              </div>
              
              {/* 醒目的登录提示 */}
              <div className="bg-gradient-to-r from-pink-400/20 to-purple-400/20 border-2 border-pink-400/50 rounded-2xl p-8 max-w-lg mx-auto backdrop-blur-sm shadow-2xl">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <Rocket className="h-8 w-8 text-pink-400 animate-bounce" />
                  <span className="text-pink-400 font-bold text-xl">连接钱包登录</span>
                  <Rocket className="h-8 w-8 text-pink-400 animate-bounce" />
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      {activeTab === 'alpha' ? '独家Alpha任务预告' : activeTab === 'stability' ? '实时稳定度数据' : '专业Booster教程'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">早期价值</span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">专业分析报告</span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">社区专属讨论</span>
                  </div>
                </div>
                
                {/* 登录注册按钮 */}
                <div className="flex space-x-3 mb-4">
                  <button
                    onClick={() => {
                      // 调用UnifiedLogin组件中的登录按钮
                      const loginBtn = document.querySelector('[data-testid="unified-login-btn"]') as HTMLButtonElement
                      if (loginBtn) {
                        loginBtn.click()
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>登录</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      // 调用UnifiedLogin组件中的注册按钮
                      const registerBtn = document.querySelector('[data-testid="unified-register-btn"]') as HTMLButtonElement
                      if (registerBtn) {
                        registerBtn.click()
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center justify-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>注册</span>
                  </button>
                </div>
                
                <p className="text-pink-300 text-sm mt-4">
                  💫 登录后即可查看精彩内容
                </p>
              </div>
            </div>
          ) : !isUserVip ? (
            // 已登录但非VIP用户显示升级提示
            <div className="text-center py-20">
              <div className="mb-8">
                
                <h2 className="text-2xl font-bold text-white mb-4">
                  {activeTab === 'alpha' ? '币安Alpha预告' : activeTab === 'stability' ? '稳定度看板' : '币安Booster教程'}
                </h2>
                <p className="text-gray-300 text-lg mb-8">
                  {activeTab === 'alpha' 
                    ? '此专区仅限VIP会员访问，升级为VIP会员即可查看最新的Alpha任务'
                    : activeTab === 'stability'
                    ? '此专区仅限VIP会员访问，升级为VIP会员即可查看代币稳定度数据'
                    : '此专区仅限VIP会员访问，升级为VIP会员即可查看最新的Booster教程'
                  }
                </p>
              </div>
              
              {/* 醒目的VIP升级提示 */}
              <div className="bg-gradient-to-r from-amber-400/20 to-yellow-400/20 border-2 border-amber-400/50 rounded-2xl p-8 max-w-lg mx-auto backdrop-blur-sm shadow-2xl">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  <Award className="h-8 w-8 text-amber-400 animate-bounce" />
                  <span className="text-amber-400 font-bold text-xl">VIP会员专享</span>
                  <Award className="h-8 w-8 text-amber-400 animate-bounce" />
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">
                      {activeTab === 'alpha' ? '独家Alpha任务预告' : activeTab === 'stability' ? '实时稳定度数据' : '专业Booster教程'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">早期机会</span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">专业分析报告</span>
                  </div>
                  <div className="flex items-center space-x-3 text-left">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <span className="text-gray-200">社区专属讨论</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => router.push('/subscription')}
                  className="w-full bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-black px-8 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  🚀 立即升级VIP
                </button>
                
                <p className="text-amber-300 text-sm mt-4">
                  💎 限时优惠，错过再等一年
                </p>
              </div>
            </div>
          ) : (
            // VIP用户显示内容
            <>
              {activeTab === 'stability' && (
                <StabilityBoard />
              )}

              {activeTab === 'alpha' && (
                <>
                  {/* 今日空投 */}
                  <div className="mb-8">
                    <div className="flex items-center space-x-3 mb-6">
                      <Calendar className="h-6 w-6 text-pink-400" />
                      <h2 className="text-2xl font-bold text-white">今日空投</h2>
                      <div className="bg-pink-400/20 text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
                        {airdropToday.length} 个
                      </div>
                    </div>
                    
                    {airdropLoading ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                            <div className="h-4 bg-gray-700 rounded mb-4"></div>
                            <div className="h-3 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : airdropToday.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {airdropToday.map((airdrop) => (
                          <AirdropCard key={airdrop.id} airdrop={airdrop} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700/50">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">今日暂无空投活动</p>
                      </div>
                    )}
                  </div>

                  {/* 空投预告 */}
                  <div>
                    <div className="flex items-center space-x-3 mb-6">
                      <Clock className="h-6 w-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">空投预告</h2>
                      <div className="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                        {airdropPreview.length} 个
                      </div>
                    </div>
                    
                    {airdropLoading ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                            <div className="h-4 bg-gray-700 rounded mb-4"></div>
                            <div className="h-3 bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                          </div>
                        ))}
                      </div>
                    ) : airdropPreview.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {airdropPreview.map((airdrop) => (
                          <AirdropCard key={airdrop.id} airdrop={airdrop} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700/50">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">暂无空投预告</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {activeTab === 'booster' && (
                <>
                  {/* Booster 列表（复用 ResearchCard） */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {loading ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))
                    ) : filteredTasks.length > 0 ? (
                      filteredTasks.map((task) => (
                        <ResearchCard
                          key={task.id}
                          report={task}
                          onViewDetails={(reportId) => fetchTaskDetail(reportId)}
                        />
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-300">
                          {searchTerm || selectedTag ? '没有找到匹配的Booster教程' : '暂无Booster教程'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {/* 任务详情弹窗（公用组件） */}
        {showDetailModal && selectedTask && (
          <ResearchDetailModal
            report={{
              id: selectedTask.id,
              title: selectedTask.title,
              author: selectedTask.author,
              publish_date: selectedTask.publish_date,
              views: selectedTask.views,
              likes: selectedTask.likes,
              comments_count: selectedTask.comments_count,
              tags: selectedTask.tags,
              content: selectedTask.content,
              video_url: selectedTask.video_url,
              isLiked: selectedTask.isLiked,
              isFavorited: selectedTask.isFavorited,
              commentsList: selectedTask.commentsList
            }}
            visible={true}
            onClose={() => {
              setShowDetailModal(false)
              router.replace('/alpha')
            }}
            onParticipate={undefined}
            onToggleLike={async () => {
              try {
                const operation = selectedTask.isLiked ? 'unlike' : 'like'
                const data = await publicAPI.post('/v1/global/likes', {
                  target_id: selectedTask.id,
                  type: 'research',
                  operation
                })
                if (data.api_code == 200) {
                  setSelectedTask(prev => prev ? { ...prev, isLiked: !prev.isLiked, likes: data.data.likes } : prev)
                }
              } catch {}
            }}
            onToggleFavorite={async () => {
              try {
                const operation = selectedTask.isFavorited ? 'remove' : 'add'
                const data = await publicAPI.post('/v1/global/favorites', {
                  target_id: selectedTask.id,
                  type: 'research',
                  operation
                })
                if (data.api_code == 200) {
                  setSelectedTask(prev => prev ? { ...prev, isFavorited: !prev.isFavorited } : prev)
                }
              } catch {}
            }}
            onCommentLike={async (commentId) => {
              try {
                const data = await publicAPI.post('/v1/research/comments?operation=like', { comment_id: parseInt(commentId) })
                if (data.api_code == 200) {
                  setSelectedTask(prev => {
                    if (!prev) return prev
                    return {
                      ...prev,
                      commentsList: (prev.commentsList || []).map(c => c.id === commentId ? { ...c, likes: data.data.likes } : c)
                    }
                  })
                }
              } catch {}
            }}
            onSubmitComment={async (content, replyingToId) => {
              try {
                const data = await publicAPI.post('/v1/research/comments?operation=create', {
                  report_id: selectedTask.id,
                  type: 'research',
                  content,
                  parent_id: replyingToId ? parseInt(replyingToId) : 0
                })
                if (data.api_code == 200) {
                  await fetchTaskDetail(selectedTask.id)
                }
              } catch {}
            }}
          />
        )}

        {/* 用户资料弹窗 */}
        {showProfileModal && (
          <UserProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onSave={async ({ nickname, avatar }) => {
              await saveUserProfile({ operation: 'update', nickname, avatar })
            }}
            initialProfile={{
              nickname: userProfile?.nickname || '',
              avatar: userProfile?.avatar || ''
            }}
          />
        )}
        </div>
      </div>
    </div>
  )
}
