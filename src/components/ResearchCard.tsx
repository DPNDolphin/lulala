import { Eye, Heart, MessageCircle, Bookmark, Crown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { publicAPI } from '@/lib/publicAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'

interface ResearchCardProps {
  report: {
    id: number
    title: string
    description: string
    tags?: string[]
    views: number
    likes: number
    comments?: number
    comments_count?: number
    icon: string
    video_url?: string
    isFavorited?: boolean
    is_vip_only?: number
  }
  onViewDetails: (reportId: number) => void
  onFavoriteChange?: (reportId: number, isFavorited: boolean) => void
  isNew?: boolean
}

export default function ResearchCard({ report, onViewDetails, onFavoriteChange, isNew }: ResearchCardProps) {
  const [isClient, setIsClient] = useState(false)
  const [isFavorited, setIsFavorited] = useState(report.isFavorited || false)
  const [isLoading, setIsLoading] = useState(false)
  const { address } = useAccount()
  const { user } = useMultiAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 判断用户是否为VIP
  const isUserVip = user?.vip_level ? user.vip_level > 0 : false
  // 判断内容是否为VIP专享
  const isVipContent = report.is_vip_only === 1
  // 判断是否需要模糊处理（VIP内容且用户非VIP）
  const shouldBlur = isVipContent && !isUserVip

  // 处理卡片点击
  const handleCardClick = () => {
    if (shouldBlur) {
      // VIP内容且用户非VIP时，不允许点击查看详情
      return
    }
    onViewDetails(report.id)
  }

  // 处理收藏/取消收藏
  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation() // 阻止事件冒泡，避免触发卡片点击
    
    if (!address || isLoading) return
    
    setIsLoading(true)
    try {
      const operation = isFavorited ? 'remove' : 'add'
      const data = await publicAPI.post('/v1/global/favorites', {
        target_id: report.id,
        type: 'research',
        operation: operation
      })
      
      if (data.api_code == 200) {
        const newFavorited = !isFavorited
        setIsFavorited(newFavorited)
        onFavoriteChange?.(report.id, newFavorited)
      }
    } catch (error) {
      console.error('收藏操作失败:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <article 
      className={`bg-background-card rounded-xl p-6 transition-all group relative ${
        shouldBlur 
          ? 'cursor-not-allowed' 
          : 'hover-glow hover:scale-105 cursor-pointer'
      }`}
      onClick={handleCardClick}
    >
      {isNew && (
        <div className="absolute top-2 right-2 z-20">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white shadow-md">NEW</span>
        </div>
      )}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          {isVipContent && (
            <span className="bg-amber-400/10 text-amber-400 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
              <Crown className="h-3 w-3" />
              <span>VIP</span>
            </span>
          )}
          {report.tags && report.tags.length > 0 ? (
            <>
              {report.tags.map((tag, index) => (
                <span
                  key={`${tag}-${index}`}
                  className="bg-pink-400/10 text-pink-400 px-3 py-1 rounded-full text-sm font-medium"
                >
                  {tag}
                </span>
              ))}
            </>
          ) : (
            <span className="bg-gray-400/10 text-gray-400 px-3 py-1 rounded-full text-sm font-medium">
              研究报告
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* 收藏按钮 */}
          {isClient && address && (
            <button
              onClick={handleFavorite}
              disabled={isLoading}
              className={`p-1.5 rounded-lg transition-all ${
                isFavorited 
                  ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20' 
                  : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isFavorited ? '取消收藏' : '收藏'}
            >
              <Bookmark className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
      
      {/* 内容区域 - 应用模糊效果 */}
      <div className={shouldBlur ? 'filter blur-sm' : ''}>
        <div className="flex items-start space-x-3 mb-3">
        {report.icon ? (
          <img 
            src={report.icon} 
            alt="项目图标" 
            className="w-8 h-8 rounded-lg object-cover border border-gray-200 flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
            <span className="text-gray-400 text-xs">无</span>
          </div>
        )}
        <h3 className="text-xl font-semibold text-text-primary group-hover:text-pink-400 transition-colors">
          {report.title}
        </h3>
      </div>
      
      <p className="text-text-muted mb-6 leading-relaxed">
        {report.description}
      </p>

      {/* Video preview */}
      {report.video_url && (
        <div className="mb-6">
          <div className="aspect-video">
            <iframe
              src={report.video_url}
              className="w-full h-full rounded-lg border border-gray-200"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={`${report.title} - 视频`}
            ></iframe>
          </div>
        </div>
      )}
      
      <div className="flex items-center space-x-4 text-text-muted text-sm">
        <div className="flex items-center space-x-1">
          <Eye className="h-4 w-4" />
          <span>{isClient ? report.views.toLocaleString() : report.views}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Heart className="h-4 w-4" />
          <span>{report.likes}</span>
        </div>
        <div className="flex items-center space-x-1">
          <MessageCircle className="h-4 w-4" />
          <span>{report.comments || report.comments_count || 0}</span>
        </div>
      </div>
      </div>

      {/* VIP提示覆盖层 */}
      {shouldBlur && (
        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center z-10">
          <div className="text-center text-white">
            <Crown className="h-8 w-8 mx-auto mb-2 text-amber-400" />
            <h3 className="text-lg font-semibold mb-1">VIP专享内容</h3>
            <p className="text-sm opacity-90">升级VIP会员即可解锁</p>
          </div>
        </div>
      )}
    </article>
  )
}
