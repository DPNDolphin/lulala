'use client'

import { useState, useEffect } from 'react'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  BarChart3, 
  Shield, 
  DollarSign,
  Percent,
  Activity,
  Clock,
  Star,
  Lock,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff
} from 'lucide-react'

// 交易统计数据接口
interface TradingStats {
  riskLevel: string
  monthlyReturn: string
  winRate: string
}

// 默认数据
const defaultStats: TradingStats = {
  riskLevel: '中等',
  monthlyReturn: '+12.5%',
  winRate: '78.3%'
}

const mockStrategies = {
  short: [
    {
      id: 1,
      type: '合约',
      pair: 'BTC/USDT',
      direction: '做多',
      timeframe: '15分钟',
      profit: '+8.2%',
      winRate: '85%',
      risk: '低',
      status: 'active',
      description: '基于BTC价格突破关键阻力位的短期交易策略',
      entryPrice: '$42,350',
      targetPrice: '$43,800',
      stopLoss: '$41,200',
      isPremium: true
    },
    {
      id: 2,
      type: '现货',
      pair: 'ETH/USDT',
      direction: '做多',
      timeframe: '30分钟',
      profit: '+5.7%',
      winRate: '72%',
      risk: '中',
      status: 'active',
      description: '利用ETH价格动量进行短期套利',
      entryPrice: '$2,650',
      targetPrice: '$2,780',
      stopLoss: '$2,580',
      isPremium: false
    },
    {
      id: 3,
      type: '合约',
      pair: '多币种',
      direction: '做多',
      timeframe: '1小时',
      profit: '+15.3%',
      winRate: '68%',
      risk: '高',
      status: 'active',
      description: '基于市场情绪的山寨币轮动交易',
      entryPrice: '多币种',
      targetPrice: '动态调整',
      stopLoss: '5%',
      isPremium: true
    }
  ],
  medium: [
    {
      id: 4,
      type: '现货',
      pair: '多协议组合',
      direction: '做多',
      timeframe: '日线',
      profit: '+22.1%',
      winRate: '82%',
      risk: '中',
      status: 'active',
      description: '基于DeFi协议收益优化的中期策略',
      entryPrice: '动态',
      targetPrice: '年化30%+',
      stopLoss: '10%',
      isPremium: true
    },
    {
      id: 5,
      type: '合约',
      pair: '跨链差价',
      direction: '做多',
      timeframe: '4小时',
      profit: '+18.7%',
      winRate: '75%',
      risk: '中',
      status: 'active',
      description: '利用Layer2网络价差进行套利',
      entryPrice: '多网络',
      targetPrice: '价差收敛',
      stopLoss: '3%',
      isPremium: true
    }
  ],
  long: [
    {
      id: 6,
      type: '现货',
      pair: 'BTC/USDT',
      direction: '做多',
      timeframe: '周线',
      profit: '+45.2%',
      winRate: '90%',
      risk: '低',
      status: 'active',
      description: '基于技术分析和基本面分析的长期持有策略',
      entryPrice: '$38,500',
      targetPrice: '$60,000+',
      stopLoss: '$30,000',
      isPremium: false
    },
    {
      id: 7,
      type: '现货',
      pair: '多项目组合',
      direction: '做多',
      timeframe: '月线',
      profit: '+67.8%',
      winRate: '65%',
      risk: '高',
      status: 'active',
      description: '基于项目基本面分析的价值策略',
      entryPrice: '精选项目',
      targetPrice: '3-5倍',
      stopLoss: '50%',
      isPremium: true
    }
  ]
}

export default function TradingPage() {
  const { isAuthenticated, user } = useMultiAuth()
  const [activeTab, setActiveTab] = useState<'short' | 'medium' | 'long'>('short')
  const [showPremiumContent, setShowPremiumContent] = useState(false)
  const [isTradingMember, setIsTradingMember] = useState(false)
  const [tradingStats, setTradingStats] = useState<TradingStats>(defaultStats)
  const [loadingStats, setLoadingStats] = useState(true)
  const [strategies, setStrategies] = useState<typeof mockStrategies>({
    short: [],
    medium: [],
    long: []
  })
  const [loadingStrategies, setLoadingStrategies] = useState(true)
  const [strategyCounts, setStrategyCounts] = useState({
    short: 0,
    medium: 0,
    long: 0
  })
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_count: 0,
    limit: 10,
    has_next: false,
    has_prev: false
  })

  // 加载交易统计数据
  const loadTradingStats = async () => {
    try {
      setLoadingStats(true)
      const response = await fetch('/v1/global/config')
      const data = await response.json()
      
      if (data.api_code == 200) {
        setTradingStats({
          riskLevel: data.trading_risk_level || defaultStats.riskLevel,
          monthlyReturn: data.trading_monthly_return || defaultStats.monthlyReturn,
          winRate: data.trading_win_rate || defaultStats.winRate
        })
      }
    } catch (error) {
      console.error('加载交易统计数据失败:', error)
      // 使用默认数据
      setTradingStats(defaultStats)
    } finally {
      setLoadingStats(false)
    }
  }

  // 加载策略数量
  const loadStrategyCounts = async () => {
    try {
      setLoadingCounts(true)
      const response = await fetch('/v1/trading/count')
      const data = await response.json()
      
      if (data.api_code == 200) {
        setStrategyCounts(data.data)
      } else {
        // 如果API失败，使用模拟数据
        setStrategyCounts({
          short: mockStrategies.short.length,
          medium: mockStrategies.medium.length,
          long: mockStrategies.long.length
        })
      }
    } catch (error) {
      console.error('加载策略数量失败:', error)
      // 使用模拟数据作为fallback
      setStrategyCounts({
        short: mockStrategies.short.length,
        medium: mockStrategies.medium.length,
        long: mockStrategies.long.length
      })
    } finally {
      setLoadingCounts(false)
    }
  }

  // 加载指定分类的策略数据
  const loadStrategies = async (category: 'short' | 'medium' | 'long', page: number = 1) => {
    try {
      setLoadingStrategies(true)
      const response = await fetch(`/v1/trading/list?category=${category}&page=${page}&limit=10`)
      const data = await response.json()
      
      if (data.api_code == 200) {
        setStrategies(prev => ({
          ...prev,
          [category]: data.data.strategies || []
        }))
        setPagination(data.data.pagination)
      } else {
        // 如果API失败，使用模拟数据
        setStrategies(prev => ({
          ...prev,
          [category]: mockStrategies[category]
        }))
      }
    } catch (error) {
      console.error('加载策略数据失败:', error)
      // 使用模拟数据作为fallback
      setStrategies(prev => ({
        ...prev,
        [category]: mockStrategies[category]
      }))
    } finally {
      setLoadingStrategies(false)
    }
  }

  // 检查交易会员状态
  useEffect(() => {
    // 从用户信息中获取交易会员状态
    if (user && user.trade_level === 1) {
      setIsTradingMember(true)
    } else {
      setIsTradingMember(false)
    }
  }, [user])

  // 加载交易统计数据
  useEffect(() => {
    loadTradingStats()
  }, [])

  // 加载策略数量
  useEffect(() => {
    loadStrategyCounts()
  }, [])

  // 加载当前分类的策略数据
  useEffect(() => {
    loadStrategies(activeTab)
  }, [activeTab])

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case '低': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case '中': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case '高': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  // 获取风险等级的颜色样式
  const getRiskLevelStyles = (riskLevel: string) => {
    switch (riskLevel) {
      case '低': 
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30'
        }
      case '中等': 
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30'
        }
      case '高': 
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30'
        }
      default: 
        return {
          color: 'text-gray-400',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30'
        }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10'
      case 'stopped': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    color = 'text-primary',
    bgColor = 'bg-primary/10',
    borderColor = 'border-primary/30'
  }: {
    title: string
    value: string
    icon: any
    trend?: 'up' | 'down'
    color?: string
    bgColor?: string
    borderColor?: string
  }) => (
    <div className={`p-6 rounded-xl border ${bgColor} ${borderColor} hover:scale-105 transition-all duration-300 hover-glow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${bgColor} border ${borderColor}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-text-muted mb-1">{title}</h3>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
    </div>
  )

  const StrategyCard = ({ strategy }: { strategy: any }) => (
    <div className="bg-background-card border border-gray-800 rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover-glow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-text-primary">{strategy.pair}</h3>
            {strategy.isPremium && (
              <div className="flex items-center space-x-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                <Crown className="h-3 w-3" />
                <span>VIP</span>
              </div>
            )}
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(strategy.status)}`}>
              {strategy.status === 'active' ? '运行中' : strategy.status}
            </div>
          </div>
          {isTradingMember || !strategy.isPremium ? (
            <p className="text-text-muted text-sm mb-3">{strategy.description}</p>
          ) : (
            <div className="text-xs text-text-muted mb-3 flex items-center space-x-2">
              <Lock className="h-3 w-3" />
              <span>开通交易会员查看策略描述</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
        <div>
          <p className="text-xs text-text-muted mb-1">交易对</p>
          <p className="text-sm font-medium text-text-primary">{strategy.pair}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">类型</p>
          <p className="text-sm font-medium text-text-primary">{strategy.type}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">时间框架</p>
          <p className="text-sm font-medium text-text-primary">{strategy.timeframe}</p>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">方向</p>
          {isTradingMember && strategy.direction ? (
            <p className="text-sm font-medium text-text-primary">{strategy.direction}</p>
          ) : (
            <div className="inline-flex items-center space-x-1 text-xs text-text-muted">
              <Lock className="h-3 w-3" />
              <span>会员可见</span>
            </div>
          )}
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">风险等级</p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(strategy.risk)}`}>
            {strategy.risk}
          </div>
        </div>
        <div>
          <p className="text-xs text-text-muted mb-1">胜率</p>
          <p className="text-sm font-medium text-green-400">{strategy.winRate}</p>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-text-primary">收益表现</span>
          <span className={`text-lg font-bold ${strategy.profit.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {strategy.profit}
          </span>
        </div>

        {/* 关键数值 - 对非交易会员隐藏 */}
        {isTradingMember && strategy.entryPrice && strategy.targetPrice && strategy.stopLoss ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-muted mb-1">入场价格</p>
              <p className="font-medium text-text-primary">{strategy.entryPrice}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">目标价格</p>
              <p className="font-medium text-text-primary">{strategy.targetPrice}</p>
            </div>
            <div>
              <p className="text-text-muted mb-1">止损价格</p>
              <p className="font-medium text-text-primary">{strategy.stopLoss}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center space-x-2 text-text-muted">
              <Lock className="h-4 w-4" />
              <span className="text-sm">开通交易会员查看详细数据</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const tabs = [
    { key: 'short', label: '短期策略', count: strategyCounts.short },
    { key: 'medium', label: '中期策略', count: strategyCounts.medium },
    { key: 'long', label: '长期策略', count: strategyCounts.long }
  ] as const

  return (
    <div className="min-h-screen bg-background-primary">
      {/* 背景效果 */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-cyan-900/20 pointer-events-none" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)] pointer-events-none" />
      
      <div className="relative z-10">
        {/* 页面头部 */}
        <div className="border-b border-gray-800 bg-background-secondary/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  合约/现货策略
                </h1>
                <p className="text-text-muted mt-2">专业量化交易策略，助您把握市场机遇</p>
              </div>
              {!isTradingMember && (
                <button 
                  onClick={() => window.location.href = '/subscription?type=trading'}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-amber-500/25 flex items-center space-x-2"
                >
                  <Crown className="h-5 w-5" />
                  <span>开通交易会员</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {loadingStats ? (
              // 加载状态
              <>
                <div className="p-6 rounded-xl border bg-gray-500/10 border-gray-500/30 animate-pulse">
                  <div className="h-4 bg-gray-400 rounded mb-2"></div>
                  <div className="h-8 bg-gray-400 rounded"></div>
                </div>
                <div className="p-6 rounded-xl border bg-gray-500/10 border-gray-500/30 animate-pulse">
                  <div className="h-4 bg-gray-400 rounded mb-2"></div>
                  <div className="h-8 bg-gray-400 rounded"></div>
                </div>
                <div className="p-6 rounded-xl border bg-gray-500/10 border-gray-500/30 animate-pulse">
                  <div className="h-4 bg-gray-400 rounded mb-2"></div>
                  <div className="h-8 bg-gray-400 rounded"></div>
                </div>
                <div className="p-6 rounded-xl border bg-gray-500/10 border-gray-500/30 animate-pulse">
                  <div className="h-4 bg-gray-400 rounded mb-2"></div>
                  <div className="h-8 bg-gray-400 rounded"></div>
                </div>
              </>
            ) : (
              <>
                <StatCard
                  title="今日风险等级"
                  value={tradingStats.riskLevel}
                  icon={Shield}
                  color={getRiskLevelStyles(tradingStats.riskLevel).color}
                  bgColor={getRiskLevelStyles(tradingStats.riskLevel).bgColor}
                  borderColor={getRiskLevelStyles(tradingStats.riskLevel).borderColor}
                />
                <StatCard
                  title="近30天收益"
                  value={tradingStats.monthlyReturn}
                  icon={TrendingUp}
                  trend="up"
                  color="text-green-400"
                  bgColor="bg-green-500/10"
                  borderColor="border-green-500/30"
                />
                <StatCard
                  title="胜率"
                  value={tradingStats.winRate}
                  icon={Target}
                  color="text-blue-400"
                  bgColor="bg-blue-500/10"
                  borderColor="border-blue-500/30"
                />
                <StatCard
                  title="策略数"
                  value={loadingCounts ? "..." : (strategyCounts.short + strategyCounts.medium + strategyCounts.long).toString()}
                  icon={BarChart3}
                  color="text-purple-400"
                  bgColor="bg-purple-500/10"
                  borderColor="border-purple-500/30"
                />
              </>
            )}
          </div>

          {/* Tab导航 */}
          <div className="flex space-x-1 bg-background-card border border-gray-800 rounded-xl p-1 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30'
                    : 'text-text-muted hover:text-text-primary hover:bg-background-secondary'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  activeTab === tab.key 
                    ? 'bg-cyan-400/20 text-cyan-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* 策略列表 */}
          {loadingStrategies ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-background-card border border-gray-800 rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-400 rounded mb-2 w-1/3"></div>
                  <div className="h-3 bg-gray-400 rounded mb-4 w-2/3"></div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <div key={j}>
                        <div className="h-3 bg-gray-400 rounded mb-1 w-1/2"></div>
                        <div className="h-4 bg-gray-400 rounded w-3/4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {strategies[activeTab].map((strategy) => (
                  <StrategyCard key={strategy.id} strategy={strategy} />
                ))}
              </div>

              {/* 分页 */}
              {pagination.total_pages > 1 && (
                <div className="flex justify-center items-center space-x-4 mt-8">
                  <button
                    onClick={() => loadStrategies(activeTab, pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    上一页
                  </button>
                  <span className="text-text-muted">
                    第 {pagination.current_page} 页，共 {pagination.total_pages} 页
                  </span>
                  <button
                    onClick={() => loadStrategies(activeTab, pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
                  >
                    下一页
                  </button>
                </div>
              )}

              {/* 空状态 */}
              {strategies[activeTab].length === 0 && !loadingStrategies && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-text-primary mb-2">暂无{activeTab === 'short' ? '短期' : activeTab === 'medium' ? '中期' : '长期'}策略</h3>
                  <p className="text-text-muted">请关注其他时间框架的策略</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
