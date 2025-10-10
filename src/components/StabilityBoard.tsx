'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Activity, BarChart3, Info, HelpCircle, RefreshCw } from 'lucide-react'
import { publicAPI } from '@/lib/publicAPI'

interface StabilityBoardProps {
  className?: string
}

export default function StabilityBoard({ className = '' }: StabilityBoardProps) {
  const [tokens, setTokens] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    loadStabilityData(true) // 初始加载显示loading
    
    // 设置10秒自动刷新
    const interval = setInterval(() => {
      loadStabilityData(false) // 自动刷新不显示loading
    }, 10000) // 10秒

    // 清理定时器
    return () => clearInterval(interval)
  }, [])

  const loadStabilityData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true)
      }
      setError(null)
      
      const response = await publicAPI.get('/v1/research/alphaToken') as any
      
      if (response.api_code === 200) {
        setTokens(response.alpha_tokens || [])
        setLastUpdate(new Date())
      } else {
        setError(response.api_msg || '获取数据失败')
      }
    } catch (err) {
      console.error('加载稳定度数据失败:', err)
      setError('网络错误，请重试')
    } finally {
      if (isInitialLoad) {
        setLoading(false)
      }
    }
  }

  const getStatusColor = (status: string) => {
    if (status.includes('green')) return 'text-green-400 bg-green-400/20'
    if (status.includes('yellow')) return 'text-yellow-400 bg-yellow-400/20'
    if (status.includes('red')) return 'text-red-400 bg-red-400/20'
    return 'text-gray-400 bg-gray-400/20'
  }

  const getStatusText = (status: string) => {
    if (status.includes('stable')) return '稳定'
    if (status.includes('moderate')) return '中等'
    if (status.includes('unstable')) return '不稳定'
    return status
  }

  const getStatusIcon = (status: string) => {
    if (status.includes('green')) return <TrendingUp className="h-4 w-4" />
    if (status.includes('yellow')) return <Minus className="h-4 w-4" />
    if (status.includes('red')) return <TrendingDown className="h-4 w-4" />
    return <Activity className="h-4 w-4" />
  }

  // 安全地转换数值
  const safeNumber = (value: number | string | null | undefined, defaultValue = 0): number => {
    if (value === null || value === undefined || value === '') return defaultValue
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  if (loading) {
    return (
      <div className={`bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="h-6 w-6 text-pink-400" />
          <h2 className="text-2xl font-bold text-white">稳定度看板</h2>
        </div>
        
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-gray-800/30 rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-700 rounded w-20"></div>
                  <div className="h-4 bg-gray-700 rounded w-16"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-700 rounded w-12"></div>
                  <div className="h-4 bg-gray-700 rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-6">
          <BarChart3 className="h-6 w-6 text-pink-400" />
          <h2 className="text-2xl font-bold text-white">稳定度看板</h2>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => loadStabilityData(true)}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-black/30 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-pink-400" />
          <h2 className="text-2xl font-bold text-white">稳定度看板</h2>
          <div className="bg-pink-400/20 text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
            {tokens.length} 个代币
          </div>
          {lastUpdate && (
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>最后更新: {lastUpdate.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="text-sm">说明</span>
        </button>
      </div>

      {/* 说明面板 */}
      {showExplanation && (
        <div className="mb-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Info className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">稳定度判定标准</h3>
                <p className="text-gray-300 leading-relaxed">
                  基于价格区间、成交量波动、异常涨跌和短期趋势等多个指标综合计算。
                  稳定度越高，代币价格波动越小，风险相对较低。
                </p>
                <div className="mt-3 flex items-center space-x-2 text-blue-400 text-sm">
                  <RefreshCw className="h-4 w-4" />
                  <span>数据每10秒自动刷新，确保实时性</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="text-white font-medium">稳定度等级</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">绿色：稳定 - 价格波动小，风险低</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">黄色：中等 - 价格波动适中</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-400 rounded-full"></div>
                      <span className="text-gray-300 text-sm">红色：不稳定 - 价格波动大，风险高</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="text-white font-medium">价差基点说明</h4>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">
                      <strong>价差基点</strong>：成交记录列表的差异，数值越小越稳定
                    </p>
                    <p className="text-gray-300 text-sm">
                      <strong>计算方式</strong>：1个基点 = 1万U增加1U磨损
                    </p>
                    <p className="text-gray-300 text-sm">
                      <strong>建议</strong>：首选双绿色（稳定度+低基点）
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tokens.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-300">暂无稳定度数据</p>
        </div>
      ) : (
        <>
          {/* 桌面端表格视图 */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700/50">
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">交易对</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">稳定度</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">
                    <div className="flex items-center space-x-2">
                      <span>价差基点</span>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="space-y-1">
                            <p><strong>价差基点</strong>：成交记录差异</p>
                            <p><strong>越小越稳定</strong>：1基点=1万U增加1U磨损</p>
                            <p><strong>建议</strong>：首选双绿色</p>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                      </div>
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">4倍天数</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b border-gray-700/30 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-white font-medium">{token.token_pair}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(token.status)}`}>
                        {getStatusIcon(token.status)}
                        <span>{getStatusText(token.status)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-300">{safeNumber(token.spr_value).toFixed(4)}</span>
                        {safeNumber(token.spr_value) < 1 && (
                          <span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full">
                            低基点
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-300">{safeNumber(token.md_value)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 移动端卡片视图 - 两行显示 */}
          <div className="md:hidden space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className="bg-gray-800/30 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                {/* 第一行：交易对 + 稳定度 */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium text-lg">{token.token_pair}</span>
                  <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(token.status)}`}>
                    {getStatusIcon(token.status)}
                    <span>{getStatusText(token.status)}</span>
                  </div>
                </div>
                
                {/* 第二行：价差基点 + 4倍天数 */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">价差基点:</span>
                    <span className="text-gray-300">{safeNumber(token.spr_value).toFixed(4)}</span>
                    {safeNumber(token.spr_value) < 1 && (
                      <span className="text-green-400 text-xs bg-green-400/20 px-2 py-0.5 rounded-full">
                        低基点
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">4倍天数:</span>
                    <span className="text-gray-300">{safeNumber(token.md_value)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
