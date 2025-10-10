'use client'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import AdminLayout from '@/components/AdminLayout'
import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Shield, 
  Target, 
  BarChart3, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  RefreshCw,
  X,
  Crown
} from 'lucide-react'

interface TradingStats {
  riskLevel: string
  monthlyReturn: string
  winRate: string
}

interface TradingStrategy {
  id: number
  type: string
  pair: string
  direction: string
  timeframe: string
  profit: string
  winRate: string
  risk: string
  status: string
  entryPrice: string
  targetPrice: string
  stopLoss: string
  category: 'short' | 'medium' | 'long'
  createdAt: string
}

// 模拟交易策略数据
const mockStrategies: TradingStrategy[] = [
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
    entryPrice: '$42,350',
    targetPrice: '$43,800',
    stopLoss: '$41,200',
    category: 'short',
    createdAt: '2024-01-15'
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
    entryPrice: '$2,650',
    targetPrice: '$2,780',
    stopLoss: '$2,580',
    category: 'short',
    createdAt: '2024-01-10'
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
    entryPrice: '多币种',
    targetPrice: '动态调整',
    stopLoss: '5%',
    category: 'short',
    createdAt: '2024-01-05'
  }
]

export default function TradingManagement() {
  const { isAuthenticated, loading } = useAdminAuth()
  const [tradingStats, setTradingStats] = useState<TradingStats>({
    riskLevel: '中等',
    monthlyReturn: '+12.5%',
    winRate: '78.3%'
  })
  const [tradingStrategies, setTradingStrategies] = useState<TradingStrategy[]>([])
  const [showAddStrategy, setShowAddStrategy] = useState(false)
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | null>(null)
  const [saving, setSaving] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // 新策略表单状态
  const [newStrategy, setNewStrategy] = useState<Omit<TradingStrategy, 'id' | 'createdAt'>>({
    type: '合约',
    pair: '',
    direction: '做多',
    timeframe: '',
    profit: '',
    winRate: '',
    risk: '中',
    status: 'active',
    entryPrice: '',
    targetPrice: '',
    stopLoss: '',
    category: 'short'
  })

  // 加载数据
  const loadData = async () => {
    try {
      setLoadingData(true)
      
      // 加载交易统计数据
      const response = await fetch('/v1/global/config')
      const data = await response.json()
      
      if (data.api_code == 200) {
        setTradingStats({
          riskLevel: data.trading_risk_level || '中等',
          monthlyReturn: data.trading_monthly_return || '+12.5%',
          winRate: data.trading_win_rate || '78.3%'
        })
      }
      
      // 加载策略数据
      const strategiesResponse = await fetch('/v1/trading/adminList')
      const strategiesData = await strategiesResponse.json()
      
      if (strategiesData.api_code == 200) {
        setTradingStrategies(strategiesData.data.strategies || [])
      } else {
        // 如果API失败，使用模拟数据
        setTradingStrategies(mockStrategies)
      }
    } catch (error) {
      console.error('加载数据失败:', error)
      setMessage({ type: 'error', text: '加载数据失败' })
    } finally {
      setLoadingData(false)
    }
  }

  // 保存统计数据
  const saveStats = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      const formData = new FormData()
      formData.append('trading_risk_level', tradingStats.riskLevel)
      formData.append('trading_monthly_return', tradingStats.monthlyReturn)
      formData.append('trading_win_rate', tradingStats.winRate)
      
      const response = await fetch('/v1/admin/saveConfig', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.api_code == 200) {
        setMessage({ type: 'success', text: '统计数据保存成功' })
      } else {
        setMessage({ type: 'error', text: data.api_msg || '保存失败' })
      }
    } catch (error) {
      console.error('保存失败:', error)
      setMessage({ type: 'error', text: '保存失败' })
    } finally {
      setSaving(false)
    }
  }

  // 添加新策略
  const addStrategy = async () => {
    if (!newStrategy.pair.trim()) {
      setMessage({ type: 'error', text: '请填写交易对' })
      return
    }

    try {
      setSaving(true)
      setMessage(null)
      
      const formData = new FormData()
      formData.append('type', newStrategy.type)
      formData.append('pair', newStrategy.pair)
      formData.append('direction', newStrategy.direction)
      formData.append('timeframe', newStrategy.timeframe)
      formData.append('profit', newStrategy.profit)
      formData.append('win_rate', newStrategy.winRate)
      formData.append('risk', newStrategy.risk)
      formData.append('status', newStrategy.status)
      formData.append('entry_price', newStrategy.entryPrice)
      formData.append('target_price', newStrategy.targetPrice)
      formData.append('stop_loss', newStrategy.stopLoss)
      formData.append('category', newStrategy.category)
      
      const response = await fetch('/v1/trading/adminCreate', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.api_code == 200) {
        // 重新加载策略列表
        await loadData()
        setShowAddStrategy(false)
        setNewStrategy({
          type: '合约',
          pair: '',
          direction: '做多',
          timeframe: '',
          profit: '',
          winRate: '',
          risk: '中',
          status: 'active',
          entryPrice: '',
          targetPrice: '',
          stopLoss: '',
          category: 'short'
        })
        setMessage({ type: 'success', text: '策略添加成功' })
      } else {
        setMessage({ type: 'error', text: data.api_msg || '添加失败' })
      }
    } catch (error) {
      console.error('添加策略失败:', error)
      setMessage({ type: 'error', text: '添加失败' })
    } finally {
      setSaving(false)
    }
  }

  // 编辑策略
  const editStrategy = async (strategy: TradingStrategy) => {
    try {
      setSaving(true)
      setMessage(null)
      
      const formData = new FormData()
      formData.append('id', strategy.id.toString())
      formData.append('type', strategy.type)
      formData.append('pair', strategy.pair)
      formData.append('direction', strategy.direction)
      formData.append('timeframe', strategy.timeframe)
      formData.append('profit', strategy.profit)
      formData.append('win_rate', strategy.winRate)
      formData.append('risk', strategy.risk)
      formData.append('status', strategy.status)
      formData.append('entry_price', strategy.entryPrice)
      formData.append('target_price', strategy.targetPrice)
      formData.append('stop_loss', strategy.stopLoss)
      formData.append('category', strategy.category)
      
      const response = await fetch('/v1/trading/adminUpdate', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.api_code == 200) {
        // 重新加载策略列表
        await loadData()
        setEditingStrategy(null)
        setMessage({ type: 'success', text: '策略更新成功' })
      } else {
        setMessage({ type: 'error', text: data.api_msg || '更新失败' })
      }
    } catch (error) {
      console.error('更新策略失败:', error)
      setMessage({ type: 'error', text: '更新失败' })
    } finally {
      setSaving(false)
    }
  }

  // 删除策略
  const deleteStrategy = async (id: number) => {
    if (confirm('确定要删除这个策略吗？')) {
      try {
        setSaving(true)
        setMessage(null)
        
        const formData = new FormData()
        formData.append('id', id.toString())
        
        const response = await fetch('/v1/trading/adminDelete', {
          method: 'POST',
          body: formData
        })
        
        const data = await response.json()
        
        if (data.api_code == 200) {
          // 重新加载策略列表
          await loadData()
          setMessage({ type: 'success', text: '策略删除成功' })
        } else {
          setMessage({ type: 'error', text: data.api_msg || '删除失败' })
        }
      } catch (error) {
        console.error('删除策略失败:', error)
        setMessage({ type: 'error', text: '删除失败' })
      } finally {
        setSaving(false)
      }
    }
  }

  // 获取风险等级颜色
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case '低': return 'text-green-400 bg-green-500/10 border-green-500/30'
      case '中': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
      case '高': return 'text-red-400 bg-red-500/10 border-red-500/30'
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30'
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400 bg-green-500/10'
      case 'paused': return 'text-yellow-400 bg-yellow-500/10'
      case 'stopped': return 'text-red-400 bg-red-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadData()
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">交易策略管理</h2>
          <p className="text-gray-600">管理交易统计数据和服务策略</p>
        </div>

        {/* 交易统计数据 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">交易统计数据</h3>
            <p className="text-sm text-gray-600 mt-1">手动设置今日风险等级、近30天收益和胜率</p>
          </div>
          
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载数据中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 今日风险等级 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
                        <Shield className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">今日风险等级</h4>
                        <p className="text-xs text-gray-500">手动设置</p>
                      </div>
                    </div>
                    <select
                      value={tradingStats.riskLevel}
                      onChange={(e) => setTradingStats(prev => ({ ...prev, riskLevel: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="低">低</option>
                      <option value="中等">中等</option>
                      <option value="高">高</option>
                    </select>
                  </div>

                  {/* 近30天收益 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">近30天收益</h4>
                        <p className="text-xs text-gray-500">手动设置</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={tradingStats.monthlyReturn}
                      onChange={(e) => setTradingStats(prev => ({ ...prev, monthlyReturn: e.target.value }))}
                      placeholder="+12.5%"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>

                  {/* 胜率 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">胜率</h4>
                        <p className="text-xs text-gray-500">手动设置</p>
                      </div>
                    </div>
                    <input
                      type="text"
                      value={tradingStats.winRate}
                      onChange={(e) => setTradingStats(prev => ({ ...prev, winRate: e.target.value }))}
                      placeholder="78.3%"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveStats}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存统计数据
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 策略管理 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">策略列表</h3>
                <p className="text-sm text-gray-600 mt-1">管理所有交易策略</p>
              </div>
              <button
                onClick={() => setShowAddStrategy(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                新增策略
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载数据中...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">交易对</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">方向</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间框架</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">收益</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">胜率</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险等级</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">入场价格</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标价格</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">止损价格</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tradingStrategies.map((strategy) => (
                      <tr key={strategy.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.pair}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.type}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.direction}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.timeframe}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${strategy.profit.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {strategy.profit}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600 font-medium">{strategy.winRate}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(strategy.risk)}`}>
                            {strategy.risk}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.entryPrice}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.targetPrice}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{strategy.stopLoss}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(strategy.status)}`}>
                            {strategy.status === 'active' ? '运行中' : strategy.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingStrategy(strategy)}
                              className="text-blue-600 hover:text-blue-900"
                              title="编辑策略"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteStrategy(strategy.id)}
                              className="text-red-600 hover:text-red-900"
                              title="删除策略"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {tradingStrategies.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无策略</h3>
                    <p className="text-gray-600 mb-4">点击"新增策略"按钮添加第一个交易策略</p>
                    <button
                      onClick={() => setShowAddStrategy(true)}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      新增策略
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 新增策略模态框 */}
        {showAddStrategy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">新增策略</h3>
                <button
                  onClick={() => setShowAddStrategy(false)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">交易对</label>
                    <input
                      type="text"
                      value={newStrategy.pair}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, pair: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="BTC/USDT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <select
                      value={newStrategy.type}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="合约">合约</option>
                      <option value="现货">现货</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
                    <select
                      value={newStrategy.direction}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, direction: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="做多">做多</option>
                      <option value="做空">做空</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时间框架</label>
                    <input
                      type="text"
                      value={newStrategy.timeframe}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, timeframe: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="15分钟"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                    <select
                      value={newStrategy.risk}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, risk: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">收益</label>
                    <input
                      type="text"
                      value={newStrategy.profit}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, profit: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="+8.2%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">胜率</label>
                    <input
                      type="text"
                      value={newStrategy.winRate}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, winRate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="85%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                    <select
                      value={newStrategy.risk}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, risk: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                </div>


                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入场价格</label>
                    <input
                      type="text"
                      value={newStrategy.entryPrice}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, entryPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$42,350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标价格</label>
                    <input
                      type="text"
                      value={newStrategy.targetPrice}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, targetPrice: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$43,800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">止损价格</label>
                    <input
                      type="text"
                      value={newStrategy.stopLoss}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, stopLoss: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$41,200"
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  所有策略均为VIP策略
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddStrategy(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addStrategy}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  添加策略
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 编辑策略模态框 */}
        {editingStrategy && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">编辑策略</h3>
                <button
                  onClick={() => setEditingStrategy(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">交易对</label>
                    <input
                      type="text"
                      value={editingStrategy.pair}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, pair: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="BTC/USDT"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
                    <select
                      value={editingStrategy.type}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, type: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="合约">合约</option>
                      <option value="现货">现货</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">方向</label>
                    <select
                      value={editingStrategy.direction}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, direction: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="做多">做多</option>
                      <option value="做空">做空</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">时间框架</label>
                    <input
                      type="text"
                      value={editingStrategy.timeframe}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, timeframe: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="15分钟"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                    <select
                      value={editingStrategy.risk}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, risk: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">收益</label>
                    <input
                      type="text"
                      value={editingStrategy.profit}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, profit: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="+8.2%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">胜率</label>
                    <input
                      type="text"
                      value={editingStrategy.winRate}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, winRate: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="85%"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                    <select
                      value={editingStrategy.risk}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, risk: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="低">低</option>
                      <option value="中">中</option>
                      <option value="高">高</option>
                    </select>
                  </div>
                </div>


                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">入场价格</label>
                    <input
                      type="text"
                      value={editingStrategy.entryPrice}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, entryPrice: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$42,350"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">目标价格</label>
                    <input
                      type="text"
                      value={editingStrategy.targetPrice}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, targetPrice: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$43,800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">止损价格</label>
                    <input
                      type="text"
                      value={editingStrategy.stopLoss}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, stopLoss: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      placeholder="$41,200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">策略分类</label>
                    <select
                      value={editingStrategy.category}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, category: e.target.value as 'short' | 'medium' | 'long' } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="short">短期策略</option>
                      <option value="medium">中期策略</option>
                      <option value="long">长期策略</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">策略状态</label>
                    <select
                      value={editingStrategy.status}
                      onChange={(e) => setEditingStrategy(prev => prev ? { ...prev, status: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="active">运行中</option>
                      <option value="paused">暂停</option>
                      <option value="stopped">停止</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditingStrategy(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => editingStrategy && editStrategy(editingStrategy)}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '保存中...' : '保存修改'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg z-50 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
