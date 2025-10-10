'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import UserProfileModal from '@/components/UserProfileModal'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { Search, Filter, Star, Calendar, X, Heart, MessageCircle, Send, Eye, TrendingUp, CheckCircle, Rocket, Reply, Bookmark } from 'lucide-react'
import ResearchCard from '@/components/ResearchCard'
import { publicAPI, userProfileAPI } from '@/lib/publicAPI'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import ResearchDetailModal from '@/components/ResearchDetailModal'
import { useToast } from '@/components/Toast'

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

interface ResearchReport {
  id: number
  title: string
  description: string
  author: string
  publish_date: string
  views: number
  likes: number
  comments_count: number
  tags: string[]
  content: string
  icon: string
  video_url?: string
  status: string
  featured: number
  is_vip_only?: number
  isLiked?: boolean
  isFavorited?: boolean
  isParticipated?: boolean
  commentsList?: Comment[]
  // 为了兼容ResearchCard组件，添加这些字段
  comments?: number
  images?: string[]
}

export default function ResearchPage() {
  const { isAuthenticated, user, loading: isLoading, refreshAuth } = useMultiAuth()
  const { showWarning, showSuccess, showError, ToastContainer } = useToast()
  const [mounted, setMounted] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])
  
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [showParticipateSuccess, setShowParticipateSuccess] = useState(false)
  const [reports, setReports] = useState<ResearchReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [userProfile, setUserProfile] = useState<{ nickname: string; avatar: string } | null>(null)

  // 获取报告列表
  const fetchReports = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params: Record<string, any> = {
        page: currentPage,
        limit: 10,
        sort: 'created_at',
        order: 'DESC',
        exclude_alpha: '1' // 排除Alpha任务
      }
      
      if (searchTerm) {
        params.search = searchTerm
      }
      
      const data = await publicAPI.get('/v1/research/listPublic', params)
      
      if (data.api_code == 200) {
        const reportsData = data.data.reports.map((report: any) => ({
          ...report,
          isLiked: false,
          isFavorited: false, // 初始状态
          commentsList: [],
          // 为了兼容ResearchCard组件
          comments: report.comments_count,
          images: [] // 暂时为空数组
        }))
        setReports(reportsData)
        setTotalPages(data.data.pagination.pages)
        
        // 检查收藏状态
        if (isAuthenticated) {
          await checkFavoritesStatus(reportsData)
        }
      } else {
        setError(data.api_msg || '获取报告列表失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 检查收藏状态
  const checkFavoritesStatus = async (reports: any[]) => {
    if (!isAuthenticated) return
    
    try {
      const promises = reports.map(async (report) => {
        try {
          const data = await publicAPI.post('/v1/global/favorites', {
            target_id: report.id,
            type: 'research',
            operation: 'check'
          })
          
          if (data.api_code == 200) {
            return {
              id: report.id,
              isFavorited: data.data.is_favorited
            }
          }
        } catch (error) {
          console.error(`检查报告 ${report.id} 收藏状态失败:`, error)
        }
        return { id: report.id, isFavorited: false }
      })
      
      const results = await Promise.all(promises)
      
      // 更新收藏状态
      setReports(prev => prev.map(report => {
        const result = results.find(r => r.id === report.id)
        return result ? { ...report, isFavorited: result.isFavorited } : report
      }))
    } catch (error) {
      console.error('检查收藏状态失败:', error)
    }
  }

  // 获取报告详情
  const fetchReportDetail = async (reportId: number) => {
    try {
      const data = await publicAPI.get('/v1/research/detail', { id: reportId })
      
      if (data.api_code == 200) {
        const reportData = {
          ...data.data,
          isLiked: false, // 初始状态，后续需要检查
          isFavorited: false, // 初始状态，后续需要检查
          isParticipated: false, // 初始状态，后续需要检查
          commentsList: [],
          // 为了兼容ResearchCard组件
          comments: data.data.comments_count,
          images: [] // 暂时为空数组
        }
        setSelectedReport(reportData)
        
        // 获取评论列表
        await fetchComments(reportId)
        
        // 检查点赞、收藏和参与状态
        if (isAuthenticated) {
          await checkReportInteractionStatus(reportId, reportData)
        }
      } else {
        setError(data.api_msg || '获取报告详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 检查报告的点赞和收藏状态
  const checkReportInteractionStatus = async (reportId: number, reportData: any) => {
    if (!isAuthenticated) return
    
    try {
      // 并行检查点赞、收藏和参与状态
      const [likeData, favoriteData, participateData] = await Promise.all([
        publicAPI.post('/v1/global/likes', {
          target_id: reportId,
          type: 'research',
          operation: 'check'
        }).catch(() => ({ api_code: 200, data: { is_liked: false } })),
        
        publicAPI.post('/v1/global/favorites', {
          target_id: reportId,
          type: 'research',
          operation: 'check'
        }).catch(() => ({ api_code: 200, data: { is_favorited: false } })),
        
        // 检查参与状态 - 使用专门的参与状态检查API
        publicAPI.get('/v1/research/checkParticipate', {
          report_id: reportId
        }).catch(() => ({ api_code: 200, data: { is_participated: false } }))
      ])
      
      // 检查是否已参与当前报告
      const isParticipated = participateData.api_code == 200 
        ? participateData.data.is_participated
        : false
      
      // 更新报告状态
      setSelectedReport(prev => prev ? {
        ...prev,
        isLiked: likeData.api_code == 200 ? likeData.data.is_liked : false,
        isFavorited: favoriteData.api_code == 200 ? favoriteData.data.is_favorited : false,
        isParticipated: isParticipated
      } : null)
      
    } catch (error) {
      console.error('检查报告交互状态失败:', error)
    }
  }

  // 获取评论列表
  const fetchComments = async (reportId: number) => {
    try {
      const data = await publicAPI.get('/v1/research/comments?operation=list', { 
        report_id: reportId,
        type: 'research',
        page: 1,
        limit: 50
      })
      
      if (data.api_code == 200) {
        const comments = data.data.comments.map((comment: any) => ({
          id: comment.id.toString(),
          content: comment.content,
          timestamp: new Date(comment.created_at).toLocaleString('zh-CN'),
          likes: comment.likes,
          parent_id: comment.parent_id,
          user: {
            nickname: comment.user?.nickname || '匿名用户',
            avatar: comment.user?.avatar || ''
          }
        }))
        
        // 组织评论为2级结构
        const rootComments = comments.filter((c: Comment) => c.parent_id === 0)
        const replyComments = comments.filter((c: Comment) => c.parent_id !== 0)
        
        // 为每个根评论添加回复
        rootComments.forEach((rootComment: Comment) => {
          rootComment.replies = replyComments.filter((reply: Comment) => 
            reply.parent_id.toString() === rootComment.id
          )
        })

        // 对根评论进行排序：按点赞数降序，然后按时间升序
        rootComments.sort((a: Comment, b: Comment) => {
          if (b.likes !== a.likes) {
            return b.likes - a.likes // 点赞数降序
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() // 时间升序
        })
        
        // 对每个根评论的回复也进行排序
        rootComments.forEach((comment: Comment) => {
          if (comment.replies && comment.replies.length > 0) {
            comment.replies.sort((a: Comment, b: Comment) => {
              if (b.likes !== a.likes) {
                return b.likes - a.likes // 点赞数降序
              }
              return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() // 时间升序
            })
          }
        })
        
        setSelectedReport(prev => prev ? {
          ...prev,
          commentsList: rootComments
        } : null)
      }
    } catch (err) {
      console.error('获取评论失败:', err)
    }
  }

  // 获取标签列表
  const fetchTags = async () => {
    try {
      const data = await publicAPI.get('/v1/research/tags?operation=list')
      
      if (data.api_code == 200) {
        setAvailableTags(data.data.tags)
      }
    } catch (err) {
      console.error('获取标签失败:', err)
    }
  }

  // 获取用户信息
  const fetchUserProfile = async () => {
    if (!isAuthenticated) return null
    
    try {
      const data = await publicAPI.post('/v1/users/profile', {
        operation: 'get',
        wallet_address: user?.wallet_address
      })
      
      if (data.api_code == 200) {
        return {
          nickname: data.data.nickname || '',
          avatar: data.data.avatar || ''
        }
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
    }
    return null
  }

  // 保存用户信息
  const saveUserProfile = async (profile: { nickname: string; avatar: string }) => {
    try {
      await userProfileAPI.saveUserProfile(profile)
      setUserProfile(profile)
      // 刷新全局用户状态以更新侧边栏等地方的头像昵称
      await refreshAuth()
      console.log('✅ 投研页面用户资料保存成功，状态已刷新')
    } catch (error) {
      console.error('❌ 保存用户资料失败:', error)
      throw error
    }
  }

  // 初始化数据（无需登录即可查看）
  useEffect(() => {
    if (mounted) {
      fetchReports()
      fetchTags()
      // 如果已登录，加载用户信息
      if (isAuthenticated) {
        fetchUserProfile().then(profile => {
          setUserProfile(profile)
        })
      }
    }
  }, [mounted, currentPage, searchTerm])

  // 通过 URL 参数自动打开详情弹窗，例如 /research?id=123
  useEffect(() => {
    if (!mounted) return
    const idParam = searchParams?.get('id')
    if (idParam) {
      const reportId = parseInt(idParam, 10)
      if (!Number.isNaN(reportId)) {
        fetchReportDetail(reportId)
      }
    }
  }, [mounted, searchParams])

  // 监听钱包认证事件，实时刷新数据
  useEffect(() => {
    const onAuth = () => {
      // 认证成功后重新拉取数据
      if (isAuthenticated) {
        fetchReports()
        fetchTags()
      }
    }

    const onLogout = () => {
      // 登出时清除数据
      setReports([])
      setUserProfile(null)
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('wallet-auth-success', onAuth)
      window.addEventListener('wallet-auth-logout', onLogout)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('wallet-auth-success', onAuth)
        window.removeEventListener('wallet-auth-logout', onLogout)
      }
    }
  }, [isAuthenticated])

  const handleViewDetails = (reportId: number) => {
    fetchReportDetail(reportId)
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先连接钱包并完成认证才能点赞')
      return
    }
    
    if (!selectedReport) return
    
    try {
      const operation = selectedReport.isLiked ? 'unlike' : 'like'
      const data = await publicAPI.post('/v1/global/likes', {
        target_id: selectedReport.id,
        type: 'research',
        operation: operation
      })
      
      if (data.api_code == 200) {
        const newLikes = data.data.likes
        const newIsLiked = !selectedReport.isLiked
        
        // 更新列表中的报告
    setReports(prev => prev.map(r => 
      r.id === selectedReport.id 
            ? { ...r, likes: newLikes, isLiked: newIsLiked }
            : r
        ))
        
        // 更新当前选中的报告
    setSelectedReport(prev => prev ? {
      ...prev,
          likes: newLikes,
          isLiked: newIsLiked
    } : null)
      } else {
        setError(data.api_msg || '操作失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  const handleComment = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先连接钱包并完成认证才能评论')
      return
    }
    
    if (!selectedReport || !newComment.trim()) return
    
    // 检查用户信息是否完整
    if (!userProfile || !userProfile.nickname || 
        userProfile.nickname.startsWith('Wallet_') || 
        !userProfile.avatar) {
      setShowProfileModal(true)
      return
    }
    
    try {
      // 如果是回复，自动在内容前加上@用户名
      let content = newComment.trim()
      if (replyingTo) {
        content = `@${replyingTo.user.nickname} ${content}`
      }
      
      const data = await publicAPI.post('/v1/research/comments?operation=create', {
        report_id: selectedReport.id,
        type: 'research',
        content: content,
        wallet_address: user?.wallet_address,
        parent_id: replyingTo ? parseInt(replyingTo.id) : 0
      })
      
      if (data.api_code == 200) {
        setSuccess('评论提交成功，等待审核')
        setNewComment('')
        setReplyingTo(null)
        // 刷新评论列表
        await fetchComments(selectedReport.id)
      } else {
        setError(data.api_msg || '评论提交失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 处理回复评论
  const handleReply = (comment: Comment) => {
    setReplyingTo(comment)
    setNewComment('')
    // 聚焦到输入框
    setTimeout(() => {
      const input = document.querySelector('#comment-input') as HTMLInputElement
      if (input) {
        input.focus()
      }
    }, 100)
  }

  // 取消回复
  const cancelReply = () => {
    setReplyingTo(null)
    setNewComment('')
  }

  const handleParticipate = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录再点击参与')
      return
    }
    
    if (!selectedReport) {
      setError('报告信息不存在')
      return
    }
    
    try {
      const data = await publicAPI.post('/v1/research/participate', {
        report_id: selectedReport.id
      })
      
      if (data.api_code == 200) {
        // 更新参与状态
        setSelectedReport(prev => prev ? {
          ...prev,
          isParticipated: true
        } : null)
        
        setShowParticipateSuccess(true)
        // 3秒后自动隐藏提示
        setTimeout(() => {
          setShowParticipateSuccess(false)
        }, 3000)
      } else {
        setError(data.api_msg || '参与失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 点赞评论
  const handleCommentLike = async (commentId: string) => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录再点赞评论')
      return
    }
    
    try {
      const data = await publicAPI.post('/v1/research/comments?operation=like', {
        comment_id: parseInt(commentId)
      })
      
      if (data.api_code == 200) {
        // 更新评论列表中的点赞数
        setSelectedReport(prev => {
          if (!prev) return null
          return {
            ...prev,
            commentsList: prev.commentsList?.map(comment => 
              comment.id === commentId 
                ? { ...comment, likes: data.data.likes }
                : comment
            ) || []
          }
        })
      } else {
        setError(data.api_msg || '点赞失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }


  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchReports()
  }

  // 标签快捷搜索
  const handleTagSearch = (tag: string) => {
    setSearchTerm(tag)
    setCurrentPage(1)
    // 触发搜索
    fetchReports()
  }

  // 加载更多
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  // 处理收藏状态变化
  const handleFavoriteChange = (reportId: number, isFavorited: boolean) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, isFavorited }
        : report
    ))
  }

  // 处理详情页面的收藏
  const handleDetailFavorite = async () => {
    if (!selectedReport || !isAuthenticated) return
    
    try {
      const operation = selectedReport.isFavorited ? 'remove' : 'add'
      const data = await publicAPI.post('/v1/global/favorites', {
        target_id: selectedReport.id,
        type: 'research',
        operation: operation
      })
      
      if (data.api_code == 200) {
        const newFavorited = !selectedReport.isFavorited
        
        // 更新列表中的报告
        setReports(prev => prev.map(r => 
          r.id === selectedReport.id 
            ? { ...r, isFavorited: newFavorited }
            : r
        ))
        
        // 更新当前选中的报告
        setSelectedReport(prev => prev ? {
          ...prev,
          isFavorited: newFavorited
        } : null)
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
    }
  }

  // 未通过钱包门禁时的提示
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-text-secondary">检查登录状态中...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 relative">
      {/* 主题可控的固定背景 */}
      <div className="fixed top-0 right-0 w-full h-full pointer-events-none z-0 research-bg" />
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
            投研报告
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            专业分析师团队精心制作的深度研究报告，为您的决策提供有力支撑
          </p>
        </div>

        {/* Search and Filter - 毛玻璃效果 */}
        <div className="mb-8">
          {/* First Row: Search Bar with integrated button */}
          <form onSubmit={handleSearch} className="mb-4">
            {/* Search Bar with integrated button */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索报告标题、关键词..."
                className="w-full pl-4 pr-16 py-3 bg-white/10 backdrop-blur-md border border-gray-400/30 rounded-lg focus:border-gray-500/50 focus:outline-none text-text-primary placeholder-gray-300"
              />
              {/* Integrated Search Button */}
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1 px-3 py-1.5 bg-white/20 backdrop-blur-md border border-gray-400/30 hover:border-gray-500/50 text-text-primary hover:bg-white/30 rounded-md transition-all"
              >
                <Search className="h-4 w-4" />
                <span className="text-sm">搜索</span>
              </button>
            </div>
          </form>
          
          {/* Second Row: Tag Quick Search */}
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagSearch(tag)}
                className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-md border border-gray-400/30 hover:border-gray-500/50 hover:bg-white/20 text-text-secondary hover:text-text-primary transition-all whitespace-nowrap"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Reports Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
            <p className="text-text-secondary">加载中...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-secondary text-lg">暂无报告数据</p>
          </div>
        ) : (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {reports.map((report) => (
            <ResearchCard 
              key={report.id} 
              report={report} 
              onViewDetails={handleViewDetails}
                  onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>

        {/* Load More */}
            {currentPage < totalPages && (
        <div className="text-center mt-12">
                <button 
                  onClick={handleLoadMore}
                  className="bg-background-card hover:bg-pink-400/10 border border-gray-700 hover:border-pink-400 text-text-secondary hover:text-pink-400 px-8 py-3 rounded-lg font-medium transition-all"
                >
            加载更多报告
          </button>
        </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <ResearchDetailModal
          report={selectedReport}
          visible={true}
          onClose={() => {
            setSelectedReport(null)
            router.replace('/research')
          }}
          onParticipate={handleParticipate}
          onToggleLike={handleLike}
          onToggleFavorite={isAuthenticated ? handleDetailFavorite : undefined}
          onCommentLike={handleCommentLike}
          onSubmitComment={async (content, replyingToId) => {
            if (!isAuthenticated) {
              showWarning('需要登录', '请先连接钱包并完成认证才能评论')
              return
            }
            if (!selectedReport) return
            const data = await publicAPI.post('/v1/research/comments?operation=create', {
              report_id: selectedReport.id,
              type: 'research',
              content,
              wallet_address: user?.wallet_address,
              parent_id: replyingToId ? parseInt(replyingToId) : 0
            })
            if (data.api_code == 200) {
              await fetchComments(selectedReport.id)
            } else {
              setError(data.api_msg || '评论提交失败')
            }
          }}
        />
      )}


      {/* Participate Success Toast */}
      {showParticipateSuccess && (
        <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right duration-300">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3">
            <CheckCircle className="h-6 w-6" />
            <div>
              <div className="font-semibold">参与成功！</div>
              <div className="text-sm opacity-90">您已成功参与此投研报告的讨论</div>
            </div>
          </div>
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={saveUserProfile}
        initialProfile={userProfile || { nickname: '', avatar: '' }}
      />
      
      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  )
}
