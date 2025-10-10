'use client'

import { useState, useEffect } from 'react'
import { Clock, Coins, Star, CheckCircle, AlertCircle, Target } from 'lucide-react'
import NoSSR from '@/components/NoSSR'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { userProfileAPI } from '@/lib/publicAPI'

interface Task {
  id: string
  title: string
  description: string
  points: number
  type: 'limited' | 'daily' | 'advanced'
  endTime?: Date
  completed: boolean
  difficulty: 'easy' | 'medium' | 'hard'
}

export default function TasksPage() {
  const [activeTab, setActiveTab] = useState<'limited' | 'daily' | 'advanced'>('daily')
  const [userPoints, setUserPoints] = useState<number>(0)
  const [isClient, setIsClient] = useState(false)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useMultiAuth()

  // 获取任务数据
  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/v1/users/tasks', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('获取任务数据失败')
      }
      
      const result = await response.json()
      
      if (result.api_code == 200) {
        setTasks(result.data || [])
      } else {
        throw new Error(result.message || '获取任务数据失败')
      }
    } catch (err) {
      console.error('获取任务数据错误:', err)
      setError(err instanceof Error ? err.message : '获取任务数据失败')
    } finally {
      setLoading(false)
    }
  }

  // 完成任务
  const finishTask = async (taskId: string) => {
    try {
      const response = await fetch('/v1/users/finishTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ taskId })
      })
      
      if (!response.ok) {
        throw new Error('完成任务失败')
      }
      
      const result = await response.json()
      
      if (result.api_code == 200) {
        // 重新获取任务数据
        await fetchTasks()
        
        // 更新用户积分
        if (result.data && result.data.points_earned) {
          setUserPoints(prev => Number(prev) + Number(result.data.points_earned))
          
          // 触发全局事件，通知其他组件刷新积分
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('user-points-updated'))
          }
        }
      } else {
        throw new Error(result.message || '完成任务失败')
      }
    } catch (err) {
      console.error('完成任务错误:', err)
      alert(err instanceof Error ? err.message : '完成任务失败')
    }
  }

  // 加载用户积分
  useEffect(() => {
    const loadUserPoints = async () => {
      if (!isAuthenticated) return
      try {
        const res = await userProfileAPI.getUserProfile()
        if (res.api_code == 200 && res.data) {
          const point = Number((res.data as any).point || 0)
          setUserPoints(isNaN(point) ? 0 : point)
        }
      } catch (e) {
        console.error('加载用户积分失败', e)
      }
    }
    loadUserPoints()
  }, [isAuthenticated])

  useEffect(() => {
    setIsClient(true)
    setCurrentTime(new Date())
    
    // 获取任务数据
    fetchTasks()
    
    // 每分钟更新一次时间
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

  const filteredTasks = tasks.filter(task => task.type === activeTab)

  const formatTimeRemaining = (endTime: Date) => {
    if (!isClient || !currentTime) return ''
    
    const diff = endTime.getTime() - currentTime.getTime()
    
    if (diff <= 0) return '已结束'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) return `${days}天${hours}小时`
    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单'
      case 'medium': return '中等'
      case 'hard': return '困难'
      default: return '未知'
    }
  }

  const getTabColor = (tabType: string) => {
    switch (tabType) {
      case 'limited': return 'border-red-500 text-red-400 bg-red-900/20'
      case 'daily': return 'border-blue-500 text-blue-400 bg-blue-900/20'
      case 'advanced': return 'border-purple-500 text-purple-400 bg-purple-900/20'
      default: return 'border-gray-700 text-text-muted'
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-2">
                任务中心
              </h1>
              <p className="text-text-secondary">
                完成任务获得积分奖励，提升平台等级
              </p>
            </div>
            <div className="bg-background-secondary rounded-xl p-4 border border-amber-600/30">
              <div className="flex items-center space-x-2">
                <Coins className="h-6 w-6 text-amber-400" />
                <div>
                  <p className="text-text-muted text-sm">我的积分</p>
                  <p className="text-2xl font-bold text-amber-400">
                    {userPoints.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 标签页导航 */}
          <div className="flex space-x-1 bg-background-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveTab('limited')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'limited' 
                  ? getTabColor('limited')
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span>限时任务</span>
            </button>
            <button
              onClick={() => setActiveTab('daily')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'daily' 
                  ? getTabColor('daily')
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>日常任务</span>
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all flex items-center justify-center space-x-2 ${
                activeTab === 'advanced' 
                  ? getTabColor('advanced')
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Target className="h-4 w-4" />
              <span>进阶任务</span>
            </button>
          </div>
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              加载任务中...
            </h3>
            <p className="text-text-muted">
              正在获取最新任务信息
            </p>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-12 w-12 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              加载失败
            </h3>
            <p className="text-text-muted mb-4">
              {error}
            </p>
            <button
              onClick={fetchTasks}
              className="bg-primary hover:bg-primary-light text-white px-6 py-2 rounded-lg transition-all"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 任务列表 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
            <div
              key={task.id}
              className={`bg-background-card rounded-xl p-6 border transition-all hover:scale-105 hover-glow ${
                task.completed 
                  ? 'border-green-500/30 bg-green-900/10' 
                  : 'border-gray-700 hover:border-primary/50'
              }`}
            >
              {/* 任务状态标识 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    task.completed ? 'bg-green-400' : 'bg-amber-400'
                  }`}></div>
                  <span className={`text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                    {getDifficultyText(task.difficulty)}
                  </span>
                </div>
                {task.completed && (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                )}
              </div>

              {/* 任务标题 */}
              <h3 className="text-lg font-semibold text-text-primary mb-2">
                {task.title}
              </h3>

              {/* 任务描述 */}
              <p className="text-text-muted text-sm mb-4 leading-relaxed">
                {task.description}
              </p>

              {/* 积分奖励 */}
              <div className="flex items-center space-x-2 mb-4">
                <Coins className="h-4 w-4 text-amber-400" />
                <span className="text-amber-400 font-medium">
                  +{task.points.toLocaleString()} 积分
                </span>
              </div>

              {/* 剩余时间（限时任务） */}
              {task.type === 'limited' && task.endTime && (
                <div className="flex items-center space-x-2 mb-4 text-sm">
                  <Clock className="h-4 w-4 text-red-400" />
                  <span className="text-red-400">
                    {isClient ? (
                      `剩余时间: ${formatTimeRemaining(task.endTime)}`
                    ) : (
                      '剩余时间: 计算中...'
                    )}
                  </span>
                </div>
              )}

              {/* 验证按钮 */}
              <button
                onClick={() => !task.completed && finishTask(task.id)}
                disabled={task.completed}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                  task.completed
                    ? 'bg-green-900/20 text-green-400 border border-green-500/30 cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-light text-white hover:scale-105 hover:shadow-lg hover:shadow-primary/25'
                }`}
              >
                {task.completed ? '已完成' : '验证任务'}
              </button>
            </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="h-12 w-12 text-text-muted" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              暂无{activeTab === 'limited' ? '限时' : activeTab === 'daily' ? '日常' : '进阶'}任务
            </h3>
            <p className="text-text-muted">
              请稍后再来查看新的任务
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
