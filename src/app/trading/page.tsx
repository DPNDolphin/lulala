'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import TradingPostModal from '@/components/TradingPostModal'
import dynamic from 'next/dynamic'

// 动态导入Markdown解析器，避免SSR问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDEditorMarkdown = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false })

type TradingPost = {
  id: number
  user_id: number
  type: '现货' | '合约'
  symbol: string
  title: string
  content: string
  valid_until: number
  status: 'active' | 'draft' | 'expired'
  created_at: string
  updated_at: string
}

export default function TradingPage() {
  const { user } = useMultiAuth()

  const [typeFilter, setTypeFilter] = useState<'' | '现货' | '合约'>('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<TradingPost[]>([])
  const [strategyUser, setStrategyUser] = useState<{
    userid: number
    nickname: string
    avatar: string
  } | null>(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false
  })

  const canPublish = useMemo(() => (Number((user as any)?.can_publish_strategy) === 1), [user])
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showMyStrategies, setShowMyStrategies] = useState(false)
  const [myStrategies, setMyStrategies] = useState<TradingPost[]>([])
  const [myStrategiesLoading, setMyStrategiesLoading] = useState(false)
  const [myStrategiesPagination, setMyStrategiesPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false
  })
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editTarget, setEditTarget] = useState<TradingPost | null>(null)
  const [editPreviewMode, setEditPreviewMode] = useState(false)

  const fetchList = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (typeFilter) params.set('type', typeFilter)
      if (keyword) params.set('symbol', keyword)
      params.set('page', String(page))
      params.set('limit', '10')
      const res = await fetch(`/v1/trading/list?${params.toString()}`)
      const data = await res.json()
      if (data.api_code === 200) {
        setList(data.data.list || [])
        setStrategyUser(data.data.strategy_user || null)
        setPagination(data.data.pagination)
      } else {
        setList([])
        setStrategyUser(null)
      }
    } catch (e) {
      console.error(e)
      setList([])
    } finally {
      setLoading(false)
    }
  }

  // 获取我的策略列表
  const fetchMyStrategies = async (page = 1) => {
    try {
      setMyStrategiesLoading(true)
      const res = await fetch(`/v1/trading/myStrategies?page=${page}&limit=10`)
      const data = await res.json()
      if (data.api_code === 200) {
        // 确保数据类型正确转换
        const processedList = (data.data.list || []).map((item: any) => ({
          ...item,
          id: Number(item.id),
          user_id: Number(item.user_id),
          valid_until: Number(item.valid_until)
        }))
        setMyStrategies(processedList)
        setMyStrategiesPagination(data.data.pagination || {
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          limit: 10,
          has_next: false,
          has_prev: false
        })
      } else {
        setMyStrategies([])
        setMyStrategiesPagination({
          current_page: 1,
          total_pages: 1,
          total_count: 0,
          limit: 10,
          has_next: false,
          has_prev: false
        })
      }
    } catch (e) {
      console.error(e)
      setMyStrategies([])
      setMyStrategiesPagination({
        current_page: 1,
        total_pages: 1,
        total_count: 0,
        limit: 10,
        has_next: false,
        has_prev: false
      })
    } finally {
      setMyStrategiesLoading(false)
    }
  }

  // 显示删除确认dialog
  const showDeleteConfirm = (id: number) => {
    setDeleteTarget(id)
    setShowDeleteDialog(true)
  }

  // 确认删除策略
  const confirmDelete = async () => {
    if (!deleteTarget) return
    
    try {
      const res = await fetch('/v1/trading/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: deleteTarget })
      })
      const data = await res.json()
      
      if (data.api_code === 200) {
        // 刷新我的策略列表
        fetchMyStrategies(myStrategiesPagination.current_page)
        // 刷新主列表
        fetchList(pagination.current_page)
        setShowDeleteDialog(false)
        setDeleteTarget(null)
      } else {
        alert(data.api_msg || '删除失败')
      }
    } catch (e) {
      console.error(e)
      alert('删除失败，请重试')
    }
  }

  // 显示编辑modal
  const showEdit = (post: TradingPost) => {
    setEditTarget(post)
    setShowEditModal(true)
  }

  useEffect(() => {
    fetchList(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter])

  const formatValidUntil = (ts: number) => {
    if (!ts || ts === 0) return '长期有效'
    const now = Math.floor(Date.now() / 1000)
    const remainingSeconds = ts - now
    
    if (remainingSeconds <= 0) return '已过期'
    
    const minutes = Math.floor(remainingSeconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days}天${hours % 24}小时`
    if (hours > 0) return `${hours}小时${minutes % 60}分钟`
    return `${minutes}分钟`
  }

  // 我的策略卡片组件
  const MyStrategyCard = ({ post }: { post: TradingPost }) => {
    const createTextExcerpt = (content: string, maxLength: number = 120) => {
      const plainText = content
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]')
        .replace(/\n+/g, ' ')
        .trim()
      
      return plainText.length > maxLength ? plainText.slice(0, maxLength) + '…' : plainText
    }
    
    const excerpt = createTextExcerpt(post.content)
    
    return (
      <div className="bg-background-card border border-gray-800 rounded-xl p-6 hover:border-primary/30 transition-all duration-300">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-300">{post.type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-300">{post.symbol}</span>
              <span className="text-xs text-gray-400">有效期：{formatValidUntil(post.valid_until)}</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{post.title}</h3>
            <p className="text-sm text-text-muted mb-3">{excerpt}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => showEdit(post)}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                编辑
              </button>
              <button
                onClick={() => showDeleteConfirm(post.id)}
                className="px-3 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const PostCard = ({ post }: { post: TradingPost }) => {
    // 检查用户是否有交易VIP权限
    const hasTradeVip = user && user.trade_level && user.trade_level > 0 && 
      user.trade_vailddate && user.trade_vailddate > Math.floor(Date.now() / 1000)
    
    // 创建纯文本摘要（去除Markdown格式）
    const createTextExcerpt = (content: string, maxLength: number = 120) => {
      // 移除Markdown格式标记
      const plainText = content
        .replace(/#{1,6}\s+/g, '') // 移除标题标记
        .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
        .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
        .replace(/`(.*?)`/g, '$1') // 移除代码标记
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[图片]') // 移除图片，替换为[图片]
        .replace(/\n+/g, ' ') // 替换换行为空格
        .trim()
      
      return plainText.length > maxLength ? plainText.slice(0, maxLength) + '…' : plainText
    }
    
    const excerpt = hasTradeVip ? createTextExcerpt(post.content) : '内容需要交易VIP权限才能查看'
    
    return (
      <div className="bg-background-card border border-gray-800 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover-glow">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-300">{post.type}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border border-gray-700 text-gray-300">{post.symbol}</span>
              <span className="text-xs text-gray-400">有效期：{formatValidUntil(post.valid_until)}</span>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">{post.title}</h3>
            <p className={`text-sm ${hasTradeVip ? 'text-text-muted' : 'text-amber-400'}`}>
              {excerpt}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 检查用户交易VIP状态
  const hasTradeVip = user && user.trade_level && user.trade_level > 0 && 
    user.trade_vailddate && user.trade_vailddate > Math.floor(Date.now() / 1000)

  return (
    <div className="min-h-screen bg-background-primary">
      <div className="border-b border-gray-800 bg-background-secondary/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
            <div>
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">交易策略</h1>
                <a
                  href="/r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors underline hover:no-underline"
                >
                  全网交易所下载/注册
                </a>
              </div>
              <p className="text-text-muted mt-2">专业的交易策略分享平台，助您把握市场机会</p>
              
              {/* 交易分析师信息展示 */}
              {strategyUser && (
                <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      <img 
                        src={strategyUser.avatar || '/avatars/neutral-1.svg'} 
                        alt={strategyUser.nickname}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-blue-400/50"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/neutral-1.svg'
                        }}
                      />
                      <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-white truncate">{strategyUser.nickname}</h3>
                        <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full font-medium whitespace-nowrap">
                          Lulala认证交易分析师
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-blue-200">本页策略全部出自于该交易分析师</p>
                    </div>
                  </div>
                </div>
              )}
              
              {!hasTradeVip && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-sm text-amber-400 font-medium">需要交易VIP权限查看策略内容</span>
                  </div>
                  <p className="text-xs text-amber-300 mt-1">升级为交易VIP用户即可查看完整策略内容</p>
                </div>
              )}
            </div>
            {canPublish && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setShowPublishModal(true)}
                  className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  发布策略
                </button>
                <button
                  onClick={() => {
                    setShowMyStrategies(true)
                    fetchMyStrategies()
                  }}
                  className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg text-sm sm:text-base"
                >
                  我的策略
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${typeFilter === '' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-300 bg-transparent'}`}
            >
              全部
            </button>
            <button
              onClick={() => setTypeFilter('现货')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${typeFilter === '现货' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-300 bg-transparent'}`}
            >
              现货
            </button>
            <button
              onClick={() => setTypeFilter('合约')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border text-sm ${typeFilter === '合约' ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10' : 'border-gray-700 text-gray-300 bg-transparent'}`}
            >
              合约
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索币种/交易对"
              className="px-3 py-2 rounded-lg bg-background-card border border-gray-800 text-gray-200 placeholder-gray-500 w-full sm:w-56"
            />
            <button
              onClick={() => fetchList(1)}
              className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-sm sm:text-base"
            >
              搜索
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-background-card border border-gray-800 rounded-xl p-6 animate-pulse">
                <div className="h-5 bg-gray-700 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {list.length === 0 ? (
              <div className="text-center py-16 text-text-muted">暂无策略</div>
            ) : (
              <div className="space-y-4">
                {list.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {pagination.total_pages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => fetchList(pagination.current_page - 1)}
                  disabled={!pagination.has_prev}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >上一页</button>
                <span className="text-text-muted">第 {pagination.current_page} 页 / 共 {pagination.total_pages} 页</span>
                <button
                  onClick={() => fetchList(pagination.current_page + 1)}
                  disabled={!pagination.has_next}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                >下一页</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 发布弹窗 */}
      <TradingPostModal
        open={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        onSuccess={() => { setShowPublishModal(false); fetchList(1); }}
      />

      {/* 我的策略模态框 */}
      {showMyStrategies && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center">
          <div className="fixed inset-0 z-[10040] bg-black/80" onClick={() => setShowMyStrategies(false)} />
          <div className="relative z-[10060] w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">我的策略</h3>
              <button 
                onClick={() => setShowMyStrategies(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>
            
            {myStrategiesLoading ? (
              <div className="text-center py-8 text-gray-400">加载中...</div>
            ) : myStrategies.length === 0 ? (
              <div className="text-center py-8 text-gray-400">暂无策略</div>
            ) : (
              <>
                <div className="space-y-4">
                  {myStrategies.map((strategy) => (
                    <MyStrategyCard key={strategy.id} post={strategy} />
                  ))}
                </div>
                
                {/* 分页组件 */}
                {myStrategiesPagination.total_pages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-800">
                    <div className="text-sm text-gray-400">
                      共 {myStrategiesPagination.total_count} 条，第 {myStrategiesPagination.current_page} / {myStrategiesPagination.total_pages} 页
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchMyStrategies(myStrategiesPagination.current_page - 1)}
                        disabled={!myStrategiesPagination.has_prev}
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                      >
                        上一页
                      </button>
                      <button
                        onClick={() => fetchMyStrategies(myStrategiesPagination.current_page + 1)}
                        disabled={!myStrategiesPagination.has_next}
                        className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                      >
                        下一页
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* 删除确认Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center">
          <div className="fixed inset-0 z-[10040] bg-black/80" onClick={() => setShowDeleteDialog(false)} />
          <div className="relative z-[10060] w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text-primary">确认删除</h3>
            </div>
            <p className="text-text-muted mb-6">确定要删除这个策略吗？删除后无法恢复。</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="flex-1 px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑Modal */}
      {showEditModal && editTarget && (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center">
          <div className="fixed inset-0 z-[10040] bg-black/80" onClick={() => setShowEditModal(false)} />
          <div className="relative z-[10060] w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-text-primary">编辑策略</h3>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setEditPreviewMode(!editPreviewMode)}
                  className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                >
                  {editPreviewMode ? '编辑' : '预览'}
                </button>
                <button 
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">类型</label>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setEditTarget({...editTarget, type: '现货'})}
                    className={`px-3 py-2 rounded border ${editTarget.type === '现货' ? 'border-cyan-400 text-cyan-400' : 'border-gray-700 text-gray-300'}`}
                  >
                    现货
                  </button>
                  <button 
                    onClick={() => setEditTarget({...editTarget, type: '合约'})}
                    className={`px-3 py-2 rounded border ${editTarget.type === '合约' ? 'border-cyan-400 text-cyan-400' : 'border-gray-700 text-gray-300'}`}
                  >
                    合约
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">币种/交易对</label>
                <input
                  value={editTarget.symbol}
                  onChange={(e) => setEditTarget({...editTarget, symbol: e.target.value})}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
                  placeholder="如 BTC/USDT"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">标题</label>
                <input
                  value={editTarget.title}
                  onChange={(e) => setEditTarget({...editTarget, title: e.target.value})}
                  className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
                  placeholder="策略标题"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">内容 (Markdown格式)</label>
                {!editPreviewMode ? (
                  <div data-color-mode="dark">
                    <MDEditor
                      value={editTarget.content}
                      onChange={(value) => setEditTarget({...editTarget, content: value || ''})}
                      height={300}
                      preview="edit"
                      data-color-mode="dark"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded border border-gray-700 p-4 min-h-[300px]">
                    <MDEditorMarkdown source={editTarget.content} />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">有效期（分钟）</label>
                <input
                  type="number"
                  placeholder="有效期（分钟）"
                  value={editTarget.valid_until > 0 ? Math.floor((editTarget.valid_until - Math.floor(Date.now() / 1000)) / 60) : ''}
                  onChange={(e) => {
                    const minutes = parseInt(e.target.value) || 0
                    const validUntil = minutes > 0 ? Math.floor(Date.now() / 1000) + (minutes * 60) : 0
                    setEditTarget({...editTarget, valid_until: validUntil})
                  }}
                  className="px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white w-40"
                  min="1"
                />
                <span className="text-xs text-gray-400 ml-2">不填或0表示长期有效</span>
              </div>
              
              <div className="flex items-center gap-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={async () => {
                    if (!editTarget) return
                    
                    try {
                      const res = await fetch('/v1/trading/update', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          id: editTarget.id,
                          type: editTarget.type,
                          symbol: editTarget.symbol,
                          title: editTarget.title,
                          content: editTarget.content,
                          valid_minutes: editTarget.valid_until > 0 ? Math.floor((editTarget.valid_until - Math.floor(Date.now() / 1000)) / 60) : 0
                        })
                      })
                      const data = await res.json()
                      
                      if (data.api_code === 200) {
                        // 刷新我的策略列表
                        fetchMyStrategies(myStrategiesPagination.current_page)
                        // 刷新主列表
                        fetchList(pagination.current_page)
                        setShowEditModal(false)
                        setEditTarget(null)
                      } else {
                        alert(data.api_msg || '更新失败')
                      }
                    } catch (e) {
                      console.error(e)
                      alert('更新失败，请重试')
                    }
                  }}
                  className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
