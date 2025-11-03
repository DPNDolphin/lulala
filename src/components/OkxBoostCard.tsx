'use client'

import { useState, useEffect } from 'react'

interface OkxBoostProject {
  name: string
  description: string
  url: string
  countdown: string
  endDate: string
  participants: string
  rewardAmount: string
  rewardToken: string
  imageUrl: string
  timestamp: string
  status: 'ended' | 'claiming' | 'upcoming' | 'unknown'
  details: {
    socialLinks: {
      twitter?: string
      website?: string
      discord?: string
    }
    schedule: Array<{
      title: string
      description: string
      status: string
    }>
    rewardDetails: {
      [key: string]: string
    }
    requirements: string[]
  }
}

interface OkxBoostCardProps {
  project: OkxBoostProject
  onViewDetails: () => void
}

export default function OkxBoostCard({ project, onViewDetails }: OkxBoostCardProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [statusInfo, setStatusInfo] = useState({ isEnded: false, statusText: '', statusClass: '' })

  useEffect(() => {
    const updateCountdown = () => {
      // 根据status字段确定状态
      switch (project.status) {
        case 'ended':
          setTimeLeft(project.endDate)
          setStatusInfo({
            isEnded: true,
            statusText: '已结束',
            statusClass: 'bg-gray-600 text-gray-300'
          })
          break
        case 'claiming':
          // 对于claiming状态，仍然需要计算倒计时
          const endDate = new Date(project.endDate)
          const now = new Date()
          const diff = endDate.getTime() - now.getTime()
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          const seconds = Math.floor((diff % (1000 * 60)) / 1000)
          
          setTimeLeft(`${days}天 ${hours}时 ${minutes}分 ${seconds}秒`)
          setStatusInfo({
            isEnded: false,
            statusText: '领取中',
            statusClass: 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          })
          break
        case 'upcoming':
          // 对于upcoming状态，计算距离开始的时间
          const startDate = new Date(project.endDate) // 这里假设endDate实际上是开始时间
          const nowUpcoming = new Date()
          const diffUpcoming = startDate.getTime() - nowUpcoming.getTime()
          const daysUpcoming = Math.floor(diffUpcoming / (1000 * 60 * 60 * 24))
          const hoursUpcoming = Math.floor((diffUpcoming % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutesUpcoming = Math.floor((diffUpcoming % (1000 * 60 * 60)) / (1000 * 60))
          const secondsUpcoming = Math.floor((diffUpcoming % (1000 * 60)) / 1000)
          
          setTimeLeft(`${daysUpcoming}天 ${hoursUpcoming}时 ${minutesUpcoming}分 ${secondsUpcoming}秒`)
          setStatusInfo({
            isEnded: false,
            statusText: '距领取',
            statusClass: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
          })
          break
        case 'unknown':
        default:
          setTimeLeft('未知状态')
          setStatusInfo({
            isEnded: true,
            statusText: '未知状态',
            statusClass: 'bg-gray-600 text-gray-300'
          })
          break
      }
    }

    updateCountdown()
    // 只有claiming和upcoming状态需要实时更新倒计时
    if (project.status === 'claiming' || project.status === 'upcoming') {
      const interval = setInterval(updateCountdown, 1000)
      return () => clearInterval(interval)
    }
  }, [project.status, project.endDate])

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-cyan-400/30 transition-all duration-300 group">
      <div className="p-6">
        {/* 顶部区域 */}
        <div className="flex items-start justify-between mb-4">
          {/* 倒计时标签 */}
          <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusInfo.statusClass}`}>
            {statusInfo.statusText}: {timeLeft}
          </div>
          
          {/* 查看详情按钮 */}
          <button
            onClick={onViewDetails}
            className="bg-white text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            查看详情
          </button>
        </div>

        {/* 主要内容区域 */}
        <div className="flex items-start space-x-4 mb-6">
          {/* 项目图标 */}
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {project.imageUrl ? (
              <img
                src={project.imageUrl}
                alt={project.name}
                className="w-full h-full rounded-lg object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-white/20 rounded-lg"></div>
            )}
          </div>

          {/* 项目信息 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">
              {project.name}
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
              {project.description}
            </p>
          </div>
        </div>

        {/* 底部统计信息 */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
          {/* 参与人数 */}
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">参与人数</p>
            <p className="text-white text-lg font-bold">
              {project.participants}
            </p>
          </div>

          {/* 分隔线 */}
          <div className="w-px h-12 bg-gray-700/50 mx-4"></div>

          {/* 奖池总额 */}
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">奖池总额</p>
            <p className="text-green-400 text-lg font-bold">
              {project.rewardAmount} {project.rewardToken}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
