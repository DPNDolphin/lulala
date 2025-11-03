'use client'

import { useState, useEffect } from 'react'
import { X, ExternalLink, Users, Gift, Clock, CheckCircle } from 'lucide-react'
import { XIcon, TelegramIcon, DiscordIcon } from '@/components/CustomIcons'

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

interface OkxBoostDetailModalProps {
  project: OkxBoostProject
  visible: boolean
  onClose: () => void
}

export default function OkxBoostDetailModal({ project, visible, onClose }: OkxBoostDetailModalProps) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isEnded, setIsEnded] = useState(false)
  const [snapshotPeriod, setSnapshotPeriod] = useState('')

  useEffect(() => {
    if (!visible) return

    // 计算快照周期
    const calculateSnapshotPeriod = () => {
      if (project.details.schedule && project.details.schedule.length > 0) {
        // 找到报名开始时间
        const registrationStart = project.details.schedule.find(s => s.title === '报名开始')
        if (registrationStart) {
          const startDate = new Date(registrationStart.description)
          // 报名开始时间的前一天往前推15天
          const endDate = new Date(startDate)
          endDate.setDate(endDate.getDate() - 1) // 前一天
          
          const beginDate = new Date(endDate)
          beginDate.setDate(beginDate.getDate() - 14) // 往前推14天，总共15天
          
          const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0].replace(/-/g, '-')
          }
          
          setSnapshotPeriod(`${formatDate(beginDate)} 至 ${formatDate(endDate)}`)
        }
      }
    }

    const updateCountdown = () => {
      const endDate = new Date(project.endDate)
      const now = new Date()
      
      if (endDate > now) {
        // 活动进行中，计算倒计时
        const diff = endDate.getTime() - now.getTime()
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        setTimeLeft(`${days}天 ${hours}时 ${minutes}分 ${seconds}秒`)
        setIsEnded(false)
      } else {
        // 活动已结束
        setTimeLeft(project.endDate)
        setIsEnded(true)
      }
    }

    calculateSnapshotPeriod()
    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [visible, project.endDate, project.details.schedule])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 rounded-lg flex items-center justify-center overflow-hidden">
                {project.imageUrl ? (
                  <img
                    src={project.imageUrl}
                    alt={project.name}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 bg-white/20 rounded"></div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{project.name}</h2>
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    isEnded 
                      ? 'bg-gray-600 text-gray-300' 
                      : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                  }`}>
                    {isEnded ? '已结束' : '进行中'}
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{isEnded ? `已结束: ${timeLeft}` : `领取中: ${timeLeft}`}</span>
                  </div>
                </div>
                
                {/* 社交链接 */}
                {project.details.socialLinks && (
                  <div className="flex space-x-2">
                    {project.details.socialLinks.twitter && (
                      <a
                        href={project.details.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group flex items-center justify-center"
                        aria-label="X (Twitter)"
                      >
                        <XIcon className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </a>
                    )}
                    {project.details.socialLinks.website && (
                      <a
                        href={project.details.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group flex items-center justify-center"
                        aria-label="官网"
                      >
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </a>
                    )}
                    {project.details.socialLinks.discord && (
                      <a
                        href={project.details.socialLinks.discord}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors group flex items-center justify-center"
                        aria-label="Discord"
                      >
                        <DiscordIcon className="h-4 w-4 text-gray-400 group-hover:text-cyan-400 transition-colors" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 项目描述 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">项目介绍</h3>
            <p className="text-gray-300 leading-relaxed">
              {project.description}
            </p>
          </div>

          {/* 活动日程 */}
          {project.details.schedule && project.details.schedule.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">活动日程</h3>
              <div className="flex items-center space-x-4">
                {project.details.schedule.map((schedule, index) => (
                  <div key={index} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        schedule.status === '3' 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}>
                        {schedule.status === '3' ? '3' : <CheckCircle className="w-4 h-4" />}
                      </div>
                      <div className="mt-2 text-center">
                        <div className="text-white font-medium text-sm">{schedule.title}</div>
                        <div className="text-gray-400 text-xs mt-1">{schedule.description}</div>
                      </div>
                    </div>
                    {index < project.details.schedule.length - 1 && (
                      <div className="w-16 h-px bg-gray-700 mx-4 mt-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 奖池概况 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">奖池概况</h3>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">奖池总额</span>
                  <span className="text-white font-medium">{project.rewardAmount} {project.rewardToken}</span>
                </div>
                {project.details.rewardDetails && Object.entries(project.details.rewardDetails).map(([key, value], index) => (
                  key !== '奖池总额' && (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-400">{key}</span>
                      <span className="text-white font-medium">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* 参与条件 */}
          {project.details.requirements && project.details.requirements.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-2">参与条件</h3>
              <p className="text-gray-400 text-sm mb-4">Boost 数据快照周期为 {snapshotPeriod}</p>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="space-y-3">
                  {project.details.requirements.map((requirement, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white">{requirement}</span>
                      <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center border border-gray-600">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* 底部操作按钮 */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/30">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              活动状态: <span className={`font-medium ${isEnded ? 'text-gray-400' : 'text-green-400'}`}>
                {isEnded ? '已结束' : '进行中'}
              </span>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                关闭
              </button>
              <a
                href={project.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all font-medium"
              >
                立即参与
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
