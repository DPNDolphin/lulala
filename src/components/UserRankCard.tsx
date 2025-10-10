'use client'

import { useState, useEffect } from 'react'
import { Crown, MessageSquare, ThumbsUp, FileText, Star, TrendingUp } from 'lucide-react'
import { getUserRank, UserRank } from '@/lib/rumorsAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'

export default function UserRankCard() {
  const { isAuthenticated, user } = useMultiAuth()
  const [rankData, setRankData] = useState<UserRank | null>(null)
  const [loading, setLoading] = useState(false)

  // 加载威望数据
  const loadRankData = async () => {
    if (!isAuthenticated) return
    
    setLoading(true)
    try {
      const data = await getUserRank()
      setRankData(data)
    } catch (error) {
      console.error('加载威望数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadRankData()
    }
  }, [isAuthenticated])

  // 获取威望等级颜色
  const getRankColor = (rank: number) => {
    if (rank === 0) return 'text-gray-400'
    if (rank <= 2) return 'text-green-400'
    if (rank <= 4) return 'text-blue-400'
    if (rank <= 6) return 'text-purple-400'
    return 'text-yellow-400'
  }

  // 获取威望等级名称（使用后端返回的名称）
  const getRankName = (rankData: UserRank) => {
    return rankData.rank_name || '路人甲'
  }

  // 获取下一级所需积分
  const getNextLevelPoints = (currentRank: number) => {
    // 根据积分规则：L1→L2(累计20), L2→L3(累计50), L3→L4(累计100), L4→L5(累计200), L5→L6(累计500), L6→L7(累计2000), L7→L8(累计5000)
    const thresholds = [20, 50, 100, 200, 500, 2000, 5000]
    if (currentRank >= 8) return null
    if (currentRank === 0) return null // L0→L1 不是基于积分，而是基于行为
    return thresholds[currentRank - 1] // 当前等级-1对应数组索引
  }

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
          <div className="space-y-2">
            <div className="w-24 h-4 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-32 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!rankData) {
    return null
  }

  const nextLevelPoints = getNextLevelPoints(rankData.rank)
  const progressPercent = nextLevelPoints 
    ? Math.min((rankData.point / nextLevelPoints) * 100, 100)
    : 0

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/30 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full bg-purple-500/20 ${getRankColor(rankData.rank)}`}>
            <Crown className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">我的威望</h3>
            <p className={`text-sm font-medium ${getRankColor(rankData.rank)}`}>
              {getRankName(rankData)} Lv.{rankData.rank}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-400">{rankData.point}</p>
          <p className="text-xs text-text-muted">积分</p>
        </div>
      </div>

      {/* 进度条 */}
      {nextLevelPoints ? (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-text-muted mb-1">
            <span>升级进度</span>
            <span>{rankData.point}/{nextLevelPoints}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      ) : rankData.rank === 0 ? (
        <div className="mb-4">
          <div className="text-xs text-text-muted mb-2">
            升级条件：发布 1 条消息 或 提供 2 条线索
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((rankData.rumors_count + rankData.evidence_count / 2) * 50, 100)}%` }}
            ></div>
          </div>
        </div>
      ) : null}

      {/* 统计信息 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <MessageSquare className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-text-secondary">发布</span>
          </div>
          <p className="text-lg font-semibold text-text-primary">{rankData.rumors_count}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <FileText className="h-4 w-4 text-green-400" />
            <span className="text-sm text-text-secondary">证据</span>
          </div>
          <p className="text-lg font-semibold text-text-primary">{rankData.evidence_count}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-1 mb-1">
            <ThumbsUp className="h-4 w-4 text-pink-400" />
            <span className="text-sm text-text-secondary">互动</span>
          </div>
          <p className="text-lg font-semibold text-text-primary">{rankData.interactions_count}</p>
        </div>
      </div>

      {/* 积分规则提示 */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-text-secondary">积分规则</span>
        </div>
        <div className="text-xs text-text-muted space-y-1">
          <p>• 发布消息：+10 积分</p>
          <p>• 提供证据线索：+2 积分</p>
          <p>• 其他互动：+1 积分</p>
        </div>
      </div>
    </div>
  )
}
