'use client'

import { useState, useEffect } from 'react'
import { Wallet, Search, Filter, Check, X, Clock, AlertTriangle, Copy, RefreshCw } from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import AdminLayout from '@/components/AdminLayout'
import { useToast } from '@/components/Toast'

interface WithdrawData {
  id: string
  userid: string
  wallet_address: string
  wallet_chain_id: string
  nickname: string
  amount: string
  status: string
  created_at: string
}

interface SearchFilters {
  status: string
  nickname: string
  wallet_address: string
}

export default function WithdrawsManagement() {
  const { showSuccess, showError, showWarning, ToastContainer } = useToast()
  const [withdraws, setWithdraws] = useState<WithdrawData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    status: '',
    nickname: '',
    wallet_address: ''
  })
  const [updating, setUpdating] = useState(false)
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)

  // 获取提现列表
  const fetchWithdraws = async (page = 1) => {
    try {
      setLoading(true)
      
      // 构建查询参数
      const params: any = {
        page,
        page_size: pageSize
      }
      
      // 添加筛选参数
      if (searchFilters.status) {
        params.status = searchFilters.status
      }
      if (searchFilters.nickname) {
        params.nickname = searchFilters.nickname
      }
      if (searchFilters.wallet_address) {
        params.wallet_address = searchFilters.wallet_address
      }
      
      const response = await adminAPI.get('/v1/admin/withdrawList', params)
      
      if (response.api_code == 200) {
        setWithdraws(response.data.list || [])
        setTotal(response.data.total || 0)
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize))
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response.api_msg)
        showError('获取提现列表失败', response.api_msg || '请稍后重试')
      }
    } catch (error) {
      console.error('获取提现列表失败:', error)
      showError('获取提现列表失败', '请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // 修改提现状态
  const changeWithdrawStatus = async (id: string, newStatus: string) => {
    try {
      setUpdating(true)
      const response = await adminAPI.post('/v1/admin/withdrawAdmin', {
        operation: 'change_status',
        id,
        status: newStatus
      })
      
      if (response.api_code == 200) {
        // 更新本地数据
        setWithdraws(withdraws.map(item => 
          item.id === id ? { ...item, status: newStatus } : item
        ))
        showSuccess('状态更新成功', `提现状态已更新为${getStatusText(newStatus)}`)
      } else {
        showError('状态更新失败', response.api_msg || '请稍后重试')
      }
    } catch (error) {
      console.error('更新提现状态失败:', error)
      showError('状态更新失败', '网络错误，请稍后重试')
    } finally {
      setUpdating(false)
    }
  }

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1)
    fetchWithdraws(1)
  }

  // 重置搜索
  const handleReset = () => {
    const emptyFilters = {
      status: '',
      nickname: '',
      wallet_address: ''
    }
    setSearchFilters(emptyFilters)
    setCurrentPage(1)
    // 重置后需要重新获取数据
    setTimeout(() => {
      fetchWithdraws(1)
    }, 100)
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    fetchWithdraws(page)
  }

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待处理'
      case 'processing': return '处理中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  // 获取状态徽章样式
  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
    
    switch (status) {
      case 'pending':
        return (
          <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <Clock className="h-3 w-3 mr-1" />
            待处理
          </span>
        )
      case 'processing':
        return (
          <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <RefreshCw className="h-3 w-3 mr-1" />
            处理中
          </span>
        )
      case 'completed':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-800`}>
            <Check className="h-3 w-3 mr-1" />
            已完成
          </span>
        )
      case 'failed':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-800`}>
            <X className="h-3 w-3 mr-1" />
            失败
          </span>
        )
      case 'cancelled':
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            <X className="h-3 w-3 mr-1" />
            已取消
          </span>
        )
      default:
        return (
          <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
            {status}
          </span>
        )
    }
  }

  // 格式化钱包地址
  const formatWalletAddress = (address: string) => {
    if (!address) return '-'
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // 复制钱包地址
  const copyWalletAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address)
      showSuccess('复制成功', '钱包地址已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      showError('复制失败', '请手动复制')
    }
  }

  // 格式化金额
  const formatAmount = (amount: string) => {
    return `${amount} USDT`
  }

  useEffect(() => {
    fetchWithdraws(1)
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">提现管理</h1>
            <p className="text-gray-600 mt-2">管理用户提现申请和状态</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchWithdraws(currentPage)}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>刷新数据</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                提现状态
              </label>
              <select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters({...searchFilters, status: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
              >
                <option value="">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户昵称
              </label>
              <input
                type="text"
                value={searchFilters.nickname}
                onChange={(e) => setSearchFilters({...searchFilters, nickname: e.target.value})}
                placeholder="搜索昵称"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                钱包地址
              </label>
              <input
                type="text"
                value={searchFilters.wallet_address}
                onChange={(e) => setSearchFilters({...searchFilters, wallet_address: e.target.value})}
                placeholder="搜索钱包地址"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
              />
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleSearch}
              className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>搜索</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>重置</span>
            </button>
          </div>

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600">
            共找到 <span className="font-medium text-gray-900">{total}</span> 条提现记录
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : withdraws.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无提现记录</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提现ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      钱包地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      提现金额
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申请时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {withdraws.map((withdraw) => (
                    <tr key={withdraw.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">#{withdraw.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{withdraw.nickname || '未设置昵称'}</div>
                          <div className="text-gray-500 text-xs">ID: {withdraw.userid}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{formatWalletAddress(withdraw.wallet_address)}</span>
                          {withdraw.wallet_address && (
                            <button
                              onClick={() => copyWalletAddress(withdraw.wallet_address)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="复制钱包地址"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        {withdraw.wallet_chain_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            链ID: {withdraw.wallet_chain_id}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatAmount(withdraw.amount)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(withdraw.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {withdraw.created_at}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {withdraw.status === 'pending' && (
                            <>
                              <button
                                onClick={() => changeWithdrawStatus(withdraw.id, 'processing')}
                                disabled={updating}
                                className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors disabled:opacity-50"
                              >
                                开始处理
                              </button>
                              <button
                                onClick={() => changeWithdrawStatus(withdraw.id, 'completed')}
                                disabled={updating}
                                className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                              >
                                完成
                              </button>
                              <button
                                onClick={() => changeWithdrawStatus(withdraw.id, 'failed')}
                                disabled={updating}
                                className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                              >
                                失败
                              </button>
                            </>
                          )}
                          {withdraw.status === 'processing' && (
                            <>
                              <button
                                onClick={() => changeWithdrawStatus(withdraw.id, 'completed')}
                                disabled={updating}
                                className="px-3 py-1 text-xs bg-green-500 hover:bg-green-600 text-white rounded transition-colors disabled:opacity-50"
                              >
                                完成
                              </button>
                              <button
                                onClick={() => changeWithdrawStatus(withdraw.id, 'failed')}
                                disabled={updating}
                                className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-50"
                              >
                                失败
                              </button>
                            </>
                          )}
                          {(withdraw.status === 'completed' || withdraw.status === 'failed') && (
                            <span className="text-xs text-gray-500">已处理</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示第 {((currentPage - 1) * pageSize) + 1} 到 {Math.min(currentPage * pageSize, total)} 条，共 {total} 条
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum 
                        ? 'bg-pink-500 text-white border-pink-500' 
                        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Toast 容器 */}
      <ToastContainer />
    </AdminLayout>
  )
}
