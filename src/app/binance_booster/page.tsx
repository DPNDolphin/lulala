'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Star, Rocket } from 'lucide-react'
import ResearchCard from '@/components/ResearchCard'
import ResearchDetailModal from '@/components/ResearchDetailModal'
import { publicAPI } from '@/lib/publicAPI'

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

interface BoosterItem {
  id: number
  title: string
  description: string
  author: string
  publish_date: string
  created_at?: string
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
  comments?: number
  images?: string[]
}

export default function BinanceBoosterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<BoosterItem[]>([])
  const [selected, setSelected] = useState<BoosterItem | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  // 移除筛选相关状态

  useEffect(() => {
    setMounted(true)
    loadBoosterList()
  }, [])

  useEffect(() => {
    if (!mounted) return
    const idParam = searchParams?.get('id')
    if (idParam) {
      const reportId = parseInt(idParam, 10)
      if (!Number.isNaN(reportId)) {
        fetchDetail(reportId)
      }
    }
  }, [mounted, searchParams])

  const loadBoosterList = async () => {
    setLoading(true)
    try {
      const data = await publicAPI.get('/v1/research/listPublic', { category: 'alpha_booster' })
      if (data.api_code == 200) {
        setItems(data.data.reports || [])
      }
    } catch (e) {
      console.error('加载Booster列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDetail = async (id: number) => {
    try {
      const data = await publicAPI.get('/v1/research/detail', { id })
      if (data.api_code == 200 && data.data) {
        const detail = data.data
        const item: BoosterItem = {
          id: detail.id,
          title: detail.title,
          description: detail.description,
          author: detail.author,
          publish_date: detail.publish_date,
          created_at: detail.created_at,
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
          comments: detail.comments_count,
          images: []
        }

        const commentsRes = await publicAPI.get('/v1/research/comments?operation=list', {
          report_id: id,
          type: 'research',
          page: 1,
          limit: 50
        }).catch(() => ({ api_code: 200, data: { comments: [] } }))

        item.isLiked = false
        item.isFavorited = false

        if (commentsRes?.api_code == 200 && commentsRes.data?.comments) {
          item.commentsList = (commentsRes.data.comments || []).map((c: any) => ({
            id: String(c.id),
            content: c.content,
            timestamp: new Date(c.created_at).toISOString(),
            likes: c.likes,
            parent_id: c.parent_id,
            user: {
              nickname: c.user?.nickname || '匿名用户',
              avatar: c.user?.avatar || ''
            }
          }))
        }

        setSelected(item)
        setShowDetailModal(true)
      }
    } catch (e) {
      console.error('获取Booster详情失败', e)
    }
  }

  // 移除筛选计算，直接展示 items（默认按最新返回）

  if (!mounted) {
    return (
      <div className="min-h-screen relative">
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

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="h-8 w-8 text-pink-400" />
              <h1 className="text-3xl font-bold text-white">币安Booster教程</h1>
            </div>
            <p className="text-gray-300">精选 Booster 任务教程与操作指南</p>
          </div>

          {/* 移除筛选输入与标签选择 */}

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="h-3 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              ))
            ) : items.length > 0 ? (
              items.map((task) => {
                const isNew = (() => {
                  if (!task.created_at) return false
                  const created = Date.parse(task.created_at)
                  if (Number.isNaN(created)) return false
                  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000
                  return Date.now() - created <= THREE_DAYS_MS
                })()
                return (
                  <ResearchCard
                    key={task.id}
                    report={task}
                    onViewDetails={(reportId) => fetchDetail(reportId)}
                    isNew={isNew}
                  />
                )
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">暂无Booster教程</p>
              </div>
            )}
          </div>

          {showDetailModal && selected && (
            <ResearchDetailModal
              report={{
                id: selected.id,
                title: selected.title,
                author: selected.author,
                publish_date: selected.publish_date,
                views: selected.views,
                likes: selected.likes,
                comments_count: selected.comments_count,
                tags: selected.tags,
                content: selected.content,
                video_url: selected.video_url,
                isLiked: selected.isLiked,
                isFavorited: selected.isFavorited,
                commentsList: selected.commentsList
              }}
              visible={true}
              onClose={() => {
                setShowDetailModal(false)
                router.replace('/binance_booster')
              }}
              onParticipate={undefined}
              onToggleLike={async () => {
                try {
                  const operation = selected.isLiked ? 'unlike' : 'like'
                  const data = await publicAPI.post('/v1/global/likes', {
                    target_id: selected.id,
                    type: 'research',
                    operation
                  })
                  if (data.api_code == 200) {
                    setSelected(prev => prev ? { ...prev, isLiked: !prev.isLiked, likes: data.data.likes } : prev)
                  }
                } catch {}
              }}
              onToggleFavorite={async () => {
                try {
                  const operation = selected.isFavorited ? 'remove' : 'add'
                  const data = await publicAPI.post('/v1/global/favorites', {
                    target_id: selected.id,
                    type: 'research',
                    operation
                  })
                  if (data.api_code == 200) {
                    setSelected(prev => prev ? { ...prev, isFavorited: !prev.isFavorited } : prev)
                  }
                } catch {}
              }}
              onCommentLike={async (commentId) => {
                try {
                  const data = await publicAPI.post('/v1/research/comments?operation=like', { comment_id: parseInt(commentId) })
                  if (data.api_code == 200) {
                    setSelected(prev => {
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
                    report_id: selected.id,
                    type: 'research',
                    content,
                    parent_id: replyingToId ? parseInt(replyingToId) : 0
                  })
                  if (data.api_code == 200) {
                    await fetchDetail(selected.id)
                  }
                } catch {}
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}


