'use client'

import { useState, useEffect } from 'react'
import { Calendar, Users, Clock, TrendingUp, Filter, Download, RefreshCw, BarChart3, Trophy, Crown } from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import AdminLayout from '@/components/AdminLayout'

interface TradeVipLog {
  id: number
  grantor_userid: number
  grantor_nickname: string
  target_userid: number
  target_nickname: string
  trade_days: number
  trade_vailddate_before: number
  trade_vailddate_after: number
  grant_time: number
  grant_time_formatted: string
  trade_vailddate_before_formatted: string
  trade_vailddate_after_formatted: string
  ip_address: string
  user_agent: string
  remark: string
}

interface UserStats {
  grantor_userid: number
  grantor_nickname: string
  current_nickname: string
  display_nickname: string
  user_count: number
  total_days: number
}

interface SystemStats {
  user_count: number
  total_days: number
  recommender_nickname: string
}


export default function TradeVipLogsPage() {
  const [logs, setLogs] = useState<TradeVipLog[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [systemStats, setSystemStats] = useState<SystemStats[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'logs' | 'stats' | 'system'>('logs')
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    grantor_userid: '',
    target_userid: ''
  })

  // 加载日志数据
  const loadLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        operation: 'list',
        page: currentPage.toString(),
        limit: '20',
        ...filters
      })
      
      const response = await adminAPI.get(`/v1/admin/tradeVipLogs?${params}`)
      if (response.api_code === 200) {
        setLogs(Array.isArray(response.data.list) ? response.data.list : [])
        setTotalPages(response.data.total_pages || 1)
      } else {
        setLogs([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('加载日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        operation: 'stats',
        ...filters
      })
      
      const response = await adminAPI.get(`/v1/admin/tradeVipLogs?${params}`)
      if (response.api_code === 200) {
        setUserStats(Array.isArray(response.data) ? response.data : [])
      } else {
        setUserStats([])
      }
    } catch (error) {
      console.error('加载统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 加载系统统计数据
  const loadSystemStats = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        operation: 'system_stats',
        ...filters
      })
      
      const response = await adminAPI.get(`/v1/admin/tradeVipLogs?${params}`)
      if (response.api_code === 200) {
        setSystemStats(Array.isArray(response.data) ? response.data : [])
      } else {
        setSystemStats([])
      }
    } catch (error) {
      console.error('加载系统统计失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 根据当前标签页加载数据
  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs()
    } else if (activeTab === 'stats') {
      loadStats()
    } else if (activeTab === 'system') {
      loadSystemStats()
    }
  }, [activeTab, currentPage, filters])

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      grantor_userid: '',
      target_userid: ''
    })
    setCurrentPage(1)
  }

  // 导出数据
  const exportData = () => {
    if (activeTab === 'stats' && Array.isArray(userStats) && userStats.length > 0) {
      const csvContent = [
        ['用户名', '设置人数', '总天数'],
        ...userStats.map(stat => [
          stat.display_nickname,
          stat.user_count.toString(),
          stat.total_days.toString()
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `trade_vip_stats_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    } else if (activeTab === 'system' && Array.isArray(systemStats) && systemStats.length > 0) {
      const csvContent = [
        ['推荐人', '开通人数', '总天数'],
        ...systemStats.map(stat => [
          stat.recommender_nickname,
          stat.user_count.toString(),
          stat.total_days.toString()
        ])
      ].map(row => row.join(',')).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `trade_vip_system_stats_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    }
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">交易VIP设置日志</h1>
          <p className="text-gray-600">查看和管理交易VIP设置记录</p>
        </div>

        {/* 筛选器 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">设置者用户ID</label>
              <input
                type="number"
                value={filters.grantor_userid}
                onChange={(e) => handleFilterChange('grantor_userid', e.target.value)}
                placeholder="输入用户ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">目标用户ID</label>
              <input
                type="number"
                value={filters.target_userid}
                onChange={(e) => handleFilterChange('target_userid', e.target.value)}
                placeholder="输入用户ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3 mt-4">
            <button
              onClick={() => {
                if (activeTab === 'logs') loadLogs()
                else if (activeTab === 'stats') loadStats()
                else if (activeTab === 'system') loadSystemStats()
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>刷新</span>
            </button>
            <button
              onClick={resetFilters}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>重置</span>
            </button>
            {(activeTab === 'stats' || activeTab === 'system') && (
              <button
                onClick={exportData}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>导出</span>
              </button>
            )}
          </div>
        </div>

        {/* 标签页 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
            {[
              { key: 'logs', label: '设置记录', icon: Clock },
              { key: 'stats', label: '统计', icon: Users },
              { key: 'system', label: '系统开通', icon: Crown }
            ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">加载中...</span>
              </div>
            ) : (
              <>
                {/* 设置记录 */}
                {activeTab === 'logs' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设置者</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">目标用户</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">天数</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作日期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效期</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP地址</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(logs) && logs.length > 0 ? logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{log.grantor_nickname}</div>
                                  <div className="text-sm text-gray-500">ID: {log.grantor_userid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{log.target_nickname}</div>
                                  <div className="text-sm text-gray-500">ID: {log.target_userid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.trade_days} 天
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {log.grant_time_formatted}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {log.trade_vailddate_after_formatted}
                                </div>
                                {log.trade_vailddate_before_formatted && (
                                  <div className="text-xs text-gray-500">
                                    之前: {log.trade_vailddate_before_formatted}
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {log.ip_address}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                暂无数据
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* 分页 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-700">
                          第 {currentPage} 页，共 {totalPages} 页
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            上一页
                          </button>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            下一页
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 统计 */}
                {activeTab === 'stats' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设置人数</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总天数</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(userStats) && userStats.length > 0 ? userStats.map((stat) => (
                            <tr key={stat.grantor_userid} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{stat.display_nickname}</div>
                                  <div className="text-sm text-gray-500">ID: {stat.grantor_userid}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stat.user_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stat.total_days}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                暂无数据
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 系统开通统计 */}
                {activeTab === 'system' && (
                  <div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">推荐人</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">开通人数</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">总天数</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Array.isArray(systemStats) && systemStats.length > 0 ? systemStats.map((stat, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{stat.recommender_nickname}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stat.user_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {stat.total_days}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                暂无数据
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
