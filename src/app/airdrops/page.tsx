'use client'

import { useState, useEffect } from 'react'
import D3HeatMap from '@/components/D3HeatMap'
import { 
  Heart, 
  MessageCircle, 
  Bookmark, 
  ExternalLink, 
  Users,
  X,
  Share2,
  Star,
  Globe,
  Twitter,
  Linkedin,
  FileText
} from 'lucide-react'
import { airdropsAPI, type AirdropDetail, type AirdropComment } from '@/lib/airdropsAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { useToast } from '@/components/Toast'
import CommentSection, { type Comment } from '@/components/CommentSection'
import { publicAPI, userProfileAPI } from '@/lib/publicAPI'
import UserProfileModal from '@/components/UserProfileModal'
import ParticleAnimation from '@/components/ParticleAnimation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function AirdropsPage() {
  const { isAuthenticated, user, loading: authLoading, refreshAuth } = useMultiAuth()
  const { showSuccess, showError, showWarning, ToastContainer } = useToast()
  const [selectedAirdrop, setSelectedAirdrop] = useState<AirdropDetail | null>(null)
  const [comments, setComments] = useState<AirdropComment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<{nickname: string, avatar: string} | null>(null)
  const [showProfileModal, setShowProfileModal] = useState(false)

  // 处理从热力图点击的事件
  const handleAirdropSelect = async (airdropId: number) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await airdropsAPI.getAirdropDetail(airdropId)
      
      if (response.api_code == 200 && response.data) {
        // 将用户交互状态合并到空投数据中
        setSelectedAirdrop({
          ...response.data.airdrop,
          user_interactions: response.data.user_interactions
        })
        
        // 加载评论
        await loadComments(airdropId)
      } else {
        setError(response.api_msg || '获取项目详情失败')
      }
    } catch (err) {
      console.error('加载项目详情失败:', err)
      setError('网络错误，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  // 加载评论
  const loadComments = async (airdropId: number) => {
    try {
      const response = await airdropsAPI.getAirdropComments(airdropId, { limit: 20 })
      
      if (response.api_code == 200 && response.data) {
        setComments(response.data.comments)
      }
    } catch (err) {
      console.error('加载评论失败:', err)
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
      console.log('✅ 空投页面用户资料保存成功，状态已刷新')
    } catch (error) {
      console.error('❌ 保存用户资料失败:', error)
      throw error
    }
  }

  // 转换评论数据格式
  const convertCommentsToFormat = (airdropComments: AirdropComment[]): Comment[] => {
    // 首先将所有评论转换为标准格式
    const convertedComments = airdropComments.map(comment => ({
      id: comment.id.toString(),
      content: comment.content,
      timestamp: comment.comment_time || comment.created_at,
      likes: comment.likes || 0,
      parent_id: comment.parent_id || 0,
      user: {
        nickname: comment.user?.nickname || comment.author || '匿名用户',
        avatar: comment.user?.avatar || ''
      },
      replies: [] as Comment[]
    }))

    // 构建回复结构
    const rootComments: Comment[] = []
    const commentsMap = new Map<string, Comment>()
    
    // 建立评论映射
    convertedComments.forEach(comment => {
      commentsMap.set(comment.id, comment)
    })
    
    // 组织评论层级结构
    convertedComments.forEach(comment => {
      if (comment.parent_id === 0) {
        // 根评论
        rootComments.push(comment)
      } else {
        // 回复评论
        const parentComment = commentsMap.get(comment.parent_id.toString())
        if (parentComment && parentComment.replies) {
          parentComment.replies.push(comment)
        }
      }
    })
    
    // 对根评论进行排序：按点赞数降序，然后按时间升序
    rootComments.sort((a, b) => {
      if (b.likes !== a.likes) {
        return b.likes - a.likes // 点赞数降序
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() // 时间升序
    })
    
    // 对每个根评论的回复也进行排序
    rootComments.forEach(comment => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort((a, b) => {
          if (b.likes !== a.likes) {
            return b.likes - a.likes // 点赞数降序
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() // 时间升序
        })
      }
    })
    
    return rootComments
  }

  // 处理评论提交
  const handleCommentSubmit = async (content: string, parentId?: number) => {
    if (!selectedAirdrop) return
    
    try {
      const response = await airdropsAPI.commentAirdrop(selectedAirdrop.id, content, parentId)
      
      if (response.api_code == 200 && response.data) {
        setSelectedAirdrop({
          ...selectedAirdrop,
          comments_count: selectedAirdrop.comments_count + 1
        })
        showSuccess('评论提交成功，等待审核')
        
        // 重新加载评论
        await loadComments(selectedAirdrop.id)
      } else {
        showError(response.api_msg || '评论提交失败')
      }
    } catch (err) {
      showError('网络错误，请稍后重试')
    }
  }

  // 处理评论点赞（空投评论暂时没有点赞功能）
  const handleCommentLike = async (commentId: string) => {
    // 空投评论暂时没有点赞功能，可以后续扩展
    console.log('评论点赞功能待实现', commentId)
  }

  // 处理点赞
  const handleLike = async () => {
    if (!isAuthenticated ) {
      showWarning('需要登录', '请先登录再点赞')
      return
    }
    
    if (!selectedAirdrop) return
    
    try {
      const response = await airdropsAPI.likeAirdrop(selectedAirdrop.id)
      
      if (response.api_code == 200 && response.data) {
        setSelectedAirdrop({
          ...selectedAirdrop,
          likes: selectedAirdrop.likes + (response.data.is_liked ? 1 : -1),
          user_interactions: {
            is_liked: response.data.is_liked,
            is_favorited: selectedAirdrop.user_interactions?.is_favorited || false,
            is_participated: selectedAirdrop.user_interactions?.is_participated || false
          }
        })
      } else {
        showError(response.api_msg || '操作失败')
      }
    } catch (err) {
      console.error('点赞失败:', err)
      showError('网络错误，请稍后重试')
    }
  }

  // 处理收藏
  const handleFavorite = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录再收藏')
      return
    }
    
    if (!selectedAirdrop) return
    
    try {
      const response = await airdropsAPI.favoriteAirdrop(selectedAirdrop.id)
      
      if (response.api_code == 200 && response.data) {
        setSelectedAirdrop({
          ...selectedAirdrop,
          favorites_count: selectedAirdrop.favorites_count + (response.data.is_favorited ? 1 : -1),
          user_interactions: {
            is_liked: selectedAirdrop.user_interactions?.is_liked || false,
            is_favorited: response.data.is_favorited,
            is_participated: selectedAirdrop.user_interactions?.is_participated || false
          }
        })
      } else {
        showError(response.api_msg || '操作失败')
      }
    } catch (err) {
      console.error('收藏失败:', err)
      showError('网络错误，请稍后重试')
    }
  }

  // 处理参与
  const handleParticipate = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录再参与空投')
      return
    }
    
    if (!selectedAirdrop) return
    
    try {
      const response = await airdropsAPI.participateAirdrop(selectedAirdrop.id)
      
      if (response.api_code == 200 && response.data) {
        setSelectedAirdrop({
          ...selectedAirdrop,
          participants: selectedAirdrop.participants + 1,
          user_interactions: {
            is_liked: selectedAirdrop.user_interactions?.is_liked || false,
            is_favorited: selectedAirdrop.user_interactions?.is_favorited || false,
            is_participated: true
          }
        })
        showSuccess('参与成功！')
      } else {
        showError(response.api_msg || '操作失败')
      }
    } catch (err) {
      console.error('参与失败:', err)
      showError('网络错误，请稍后重试')
    }
  }


  // 分享功能
  const handleShare = async () => {
    if (!selectedAirdrop) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: selectedAirdrop.name,
          text: selectedAirdrop.description,
          url: window.location.href
        })
      } catch (err) {
        // 用户取消分享
      }
    } else {
      // 复制链接到剪贴板
      await navigator.clipboard.writeText(window.location.href)
      showSuccess('链接已复制到剪贴板')
    }
  }

  // 加载用户资料
  useEffect(() => {
    if (isAuthenticated) {
      fetchUserProfile().then(profile => {
        setUserProfile(profile)
      })
    } else {
      setUserProfile(null)
    }
  }, [isAuthenticated])

  return (
    <>
      {/* 粒子动画背景 - 和首页一模一样 */}
      <ParticleAnimation />
      
      <div className="h-screen w-full bg-background-primary overflow-hidden relative z-10">
        {/* 热力图占据整个页面空间 */}
        <div className="w-full h-full pt-20">
          <D3HeatMap onAirdropSelect={handleAirdropSelect} />
        </div>
      </div>

      {/* 弹出窗口详情 - 移到外层避免被overflow-hidden影响 */}
      {selectedAirdrop && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[9999] p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-background-secondary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-primary/30 shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 border-b border-gray-700 p-6 flex items-center justify-between bg-background-secondary/95">
              <div className="flex items-center space-x-3">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  {selectedAirdrop.tags && selectedAirdrop.tags.length > 0 ? selectedAirdrop.tags[0] : '空投项目'}
                </span>
                {selectedAirdrop.featured && (
                  <div className="flex items-center space-x-1 text-yellow-400">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">精选</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleParticipate}
                  disabled={selectedAirdrop.user_interactions?.is_participated}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedAirdrop.user_interactions?.is_participated
                      ? 'bg-green-500/10 text-green-500 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>{selectedAirdrop.user_interactions?.is_participated ? '已参与' : '参与空投'}</span>
                </button>
                <button
                  onClick={() => setSelectedAirdrop(null)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* 项目头部信息 */}
              <div className="flex items-start gap-4 mb-6">
                <img 
                  src={selectedAirdrop.icon} 
                  alt={selectedAirdrop.name}
                  className="w-16 h-16 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-text-primary">
                      {selectedAirdrop.name}
                    </h2>
                    {selectedAirdrop.is_vip == 1 && (
                      <span className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-sm font-semibold rounded-full">
                        VIP
                      </span>
                    )}
                    {selectedAirdrop.featured == 1 && (
                      <span className="px-3 py-1 bg-pink-500 text-white text-sm font-semibold rounded-full">
                        推荐
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted mb-4">{selectedAirdrop.description}</p>
                  
                  {/* 项目链接 */}
                  <div className="flex flex-wrap gap-3">
                    {selectedAirdrop.website && (
                      <a
                        href={selectedAirdrop.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        <span>官方网站</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedAirdrop.twitter_url && (
                      <a
                        href={selectedAirdrop.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>X</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedAirdrop.linkedin_url && (
                      <a
                        href={selectedAirdrop.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <Linkedin className="h-3.5 w-3.5" />
                        <span>LinkedIn</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {selectedAirdrop.whitepaper_url && (
                      <a
                        href={selectedAirdrop.whitepaper_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full hover:bg-primary/20 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>白皮书</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              

              {/* 视频区域 */}
              {selectedAirdrop.video_url && (
                <div className="bg-background-primary rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-xl font-semibold text-text-primary">项目视频</h3>
                  </div>
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      src={selectedAirdrop.video_url}
                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* 项目介绍 */}
              {selectedAirdrop.content && (
                <div className="bg-background-primary rounded-xl p-6 mb-6">
                  <div className="prose prose-invert max-w-none text-text-primary mb-6">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ node, ...props }) => (
                          <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
                        ),
                        h1: ({ node, ...props }) => (
                          <h1 {...props} className="text-2xl font-bold mb-4 text-text-primary" />
                        ),
                        h2: ({ node, ...props }) => (
                          <h2 {...props} className="text-xl font-bold mb-3 text-text-primary" />
                        ),
                        h3: ({ node, ...props }) => (
                          <h3 {...props} className="text-lg font-bold mb-2 text-text-primary" />
                        ),
                        p: ({ node, ...props }) => (
                          <p {...props} className="mb-4 text-text-secondary leading-relaxed" />
                        ),
                        ul: ({ node, ...props }) => (
                          <ul {...props} className="list-disc list-inside mb-4 text-text-secondary space-y-2" />
                        ),
                        ol: ({ node, ...props }) => (
                          <ol {...props} className="list-decimal list-inside mb-4 text-text-secondary space-y-2" />
                        ),
                        li: ({ node, ...props }) => (
                          <li {...props} className="ml-4" />
                        ),
                        code: ({ node, inline, ...props }: any) => 
                          inline ? (
                            <code {...props} className="bg-gray-700 text-primary px-1.5 py-0.5 rounded text-sm" />
                          ) : (
                            <code {...props} className="block bg-gray-700 text-text-primary p-4 rounded-lg mb-4 overflow-x-auto" />
                          ),
                        blockquote: ({ node, ...props }) => (
                          <blockquote {...props} className="border-l-4 border-primary pl-4 italic text-text-muted mb-4" />
                        ),
                        img: ({ node, ...props }) => (
                          <img {...props} className="rounded-lg max-w-full h-auto my-4" />
                        ),
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto mb-4">
                            <table {...props} className="min-w-full border border-gray-700" />
                          </div>
                        ),
                        thead: ({ node, ...props }) => (
                          <thead {...props} className="bg-gray-700" />
                        ),
                        th: ({ node, ...props }) => (
                          <th {...props} className="border border-gray-600 px-4 py-2 text-left text-text-primary" />
                        ),
                        td: ({ node, ...props }) => (
                          <td {...props} className="border border-gray-700 px-4 py-2 text-text-secondary" />
                        ),
                      }}
                    >
                      {selectedAirdrop.content}
                    </ReactMarkdown>
                  </div>
                  {/* 标签 */}
                  {selectedAirdrop.tags && selectedAirdrop.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedAirdrop.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* 操作按钮 */}
              <div className="flex items-center space-x-6 mb-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                    selectedAirdrop.user_interactions?.is_liked
                      ? 'bg-pink-400 text-white'
                      : 'bg-gray-700 text-text-secondary hover:bg-pink-400/20 hover:text-pink-400'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${selectedAirdrop.user_interactions?.is_liked ? 'fill-current' : ''}`} />
                  <span>{selectedAirdrop.likes}</span>
                </button>
                
                {/* 收藏按钮 */}
                {isAuthenticated && (
                  <button
                    onClick={handleFavorite}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      selectedAirdrop.user_interactions?.is_favorited
                        ? 'bg-yellow-400 text-white'
                        : 'bg-gray-700 text-text-secondary hover:bg-yellow-400/20 hover:text-yellow-400'
                    }`}
                    title={selectedAirdrop.user_interactions?.is_favorited ? '取消收藏' : '收藏'}
                  >
                    <Bookmark className={`h-5 w-5 ${selectedAirdrop.user_interactions?.is_favorited ? 'fill-current' : ''}`} />
                    <span>{selectedAirdrop.user_interactions?.is_favorited ? '已收藏' : '收藏'}</span>
                  </button>
                )}
                
                <div className="flex items-center space-x-2 text-text-muted">
                  <MessageCircle className="h-5 w-5" />
                  <span>{selectedAirdrop.comments_count} 评论</span>
                </div>
                
                <button
                  onClick={handleShare}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-700 text-text-secondary hover:bg-gray-600 transition-all"
                >
                  <Share2 className="h-5 w-5" />
                  <span>分享</span>
                </button>
              </div>
              {/* 评论区域 */}
              <div className="bg-background-primary rounded-xl p-6">
                <CommentSection
                  comments={convertCommentsToFormat(comments)}
                  commentsCount={selectedAirdrop.comments_count}
                  onSubmitComment={handleCommentSubmit}
                  onLikeComment={handleCommentLike}
                  userProfile={userProfile}
                  showProfileModal={() => setShowProfileModal(true)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 容器 */}
      <ToastContainer />

      {/* 用户资料模态框 */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={saveUserProfile}
          initialProfile={userProfile || { nickname: '', avatar: '' }}
        />
      )}
    </>
  )
}
