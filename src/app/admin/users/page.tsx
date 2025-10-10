'use client'

import { useState, useEffect } from 'react'
import { User, Crown, ToggleLeft, ToggleRight, Search, Calendar, Filter, Edit3, Check, X, Plus, Eye, Trash2, AlertTriangle, Copy } from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import AdminLayout from '@/components/AdminLayout'

interface UserData {
  userid: number
  nickname: string
  wallet_address: string
  viplevel: number
  vip_vailddate: number
  vip_expiry_date: string
  is_vip: boolean
  vip_expired: boolean
  reg_date: string
  last_login_date: string
  account_from_text: string
  accountfrom: number
  usertype?: number
  invite_reward?: number
}

interface SearchFilters {
  nickname: string
  wallet_address: string
  is_vip: string
  usertype: string
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    nickname: '',
    wallet_address: '',
    is_vip: '',
    usertype: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [pageSize] = useState(20)
  
  // 编辑VIP状态相关
  const [editingUser, setEditingUser] = useState<number | null>(null)
  const [editVipLevel, setEditVipLevel] = useState<number>(0)
  const [editVipDays, setEditVipDays] = useState<number>(30)
  const [editVipExpiryDate, setEditVipExpiryDate] = useState<string>('')
  const [updating, setUpdating] = useState(false)

  // 获取用户列表
  const fetchUsers = async (page = 1, filters = searchFilters) => {
    try {
      setLoading(true)
      const params = {
        operation: 'list',
        page,
        page_size: pageSize,
        ...filters
      }
      
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key as keyof typeof params] === '') {
          delete params[key as keyof typeof params]
        }
      })
      
      const response = await adminAPI.post('/v1/users/admin', params)
      
      if (response.api_code == 200) {
        setUsers(response.data.list || [])
        setTotal(response.data.total || 0)
        setTotalPages(Math.ceil((response.data.total || 0) / pageSize))
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 搜索处理
  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers(1, searchFilters)
  }

  // 重置搜索
  const handleReset = () => {
    const emptyFilters = {
      nickname: '',
      wallet_address: '',
      is_vip: '',
      usertype: ''
    }
    setSearchFilters(emptyFilters)
    setCurrentPage(1)
    fetchUsers(1, emptyFilters)
  }

  // 开始编辑VIP状态
  const startEditVip = (user: UserData) => {
    setEditingUser(user.userid)
    setEditVipLevel(user.viplevel)
    setEditVipDays(30) // 默认30天
    setEditVipExpiryDate(user.vip_expiry_date || '')
  }

  // 取消编辑
  const cancelEdit = () => {
    setEditingUser(null)
    setEditVipLevel(0)
    setEditVipDays(30)
    setEditVipExpiryDate('')
  }

  // 保存VIP状态
  const saveVipStatus = async (userid: number) => {
    try {
      setUpdating(true)
      const response = await adminAPI.post('/v1/users/admin', {
        operation: 'update_vip',
        userid,
        viplevel: editVipLevel,
        vip_days: editVipLevel > 0 ? editVipDays : 0,
        vip_expiry_date: editVipExpiryDate
      })
      
      if (response.api_code == 200) {
        // 更新本地数据
        setUsers(users.map(user => {
          if (user.userid === userid) {
            return {
              ...user,
              viplevel: editVipLevel,
              vip_vailddate: response.data.vip_vailddate,
              vip_expiry_date: response.data.vip_expiry_date,
              is_vip: editVipLevel > 0 && response.data.vip_vailddate > Math.floor(Date.now() / 1000),
              vip_expired: response.data.vip_vailddate > 0 && response.data.vip_vailddate <= Math.floor(Date.now() / 1000)
            }
          }
          return user
        }))
        setEditingUser(null)
        alert('VIP状态更新成功！')
      } else {
        alert('更新失败：' + response.api_msg)
      }
    } catch (error) {
      console.error('更新VIP状态失败:', error)
      alert('更新失败，请重试')
    } finally {
      setUpdating(false)
    }
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchUsers(page, searchFilters)
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
      alert('钱包地址已复制到剪贴板')
    } catch (err) {
      console.error('复制失败:', err)
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea')
      textArea.value = address
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('钱包地址已复制到剪贴板')
      } catch (fallbackErr) {
        console.error('降级复制也失败:', fallbackErr)
        alert('复制失败，请手动复制')
      }
      document.body.removeChild(textArea)
    }
  }

  // 获取VIP状态显示
  const getVipStatusBadge = (user: UserData) => {
    if (user.is_vip) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
          <Crown className="h-3 w-3 mr-1" />
          VIP{user.viplevel}
        </span>
      )
    } else if (user.vip_expired) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          已过期
        </span>
      )
    } else {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          普通用户
        </span>
      )
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
            <p className="text-gray-600 mt-2">管理用户信息和VIP状态</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => fetchUsers()}
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>刷新数据</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
            
            
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                VIP状态
              </label>
              <select
                value={searchFilters.is_vip}
                onChange={(e) => setSearchFilters({...searchFilters, is_vip: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
              >
                <option value="">全部状态</option>
                <option value="1">有效VIP</option>
                <option value="0">非VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                大使状态
              </label>
              <select
                value={searchFilters.usertype}
                onChange={(e) => setSearchFilters({...searchFilters, usertype: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
              >
                <option value="">全部</option>
                <option value="1">大使</option>
                <option value="0">非大使</option>
              </select>
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
            共找到 <span className="font-medium text-gray-900">{total}</span> 个用户
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无用户数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      用户ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      昵称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      钱包地址
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VIP状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      VIP到期时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      大使
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      注册时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      最后登录
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.userid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">#{user.userid}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{user.nickname || '-'}</td>
                      <td className="px-6 py-4 text-sm font-mono text-gray-900">
                        <div className="flex items-center space-x-2">
                          <span>{formatWalletAddress(user.wallet_address)}</span>
                          {user.wallet_address && (
                            <button
                              onClick={() => copyWalletAddress(user.wallet_address)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="复制钱包地址"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.userid ? (
                          <div className="space-y-2">
                            <select
                              value={editVipLevel}
                              onChange={(e) => setEditVipLevel(Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                            >
                              <option value={0}>普通用户</option>
                              <option value={1}>VIP1</option>
                              <option value={2}>VIP2</option>
                              <option value={3}>VIP3</option>
                            </select>
                            {editVipLevel > 0 && (
                              <input
                                type="number"
                                value={editVipDays}
                                onChange={(e) => setEditVipDays(Number(e.target.value))}
                                placeholder="VIP天数"
                                min="1"
                                max="365"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-500 focus:border-pink-500 focus:outline-none"
                              />
                            )}
                          </div>
                        ) : (
                          getVipStatusBadge(user)
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUser === user.userid ? (
                          <input
                            type="date"
                            value={editVipExpiryDate}
                            onChange={(e) => setEditVipExpiryDate(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 focus:border-pink-500 focus:outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-500">
                            {user.vip_expiry_date || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {user.usertype == 1 ? (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">大使</span>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">否</span>
                          )}
                          <button
                            onClick={async () => {
                              try {
                                const newType = user.usertype == 1 ? 0 : 1
                                const resp = await adminAPI.post('/v1/users/admin', {
                                  operation: 'update_usertype',
                                  userid: user.userid,
                                  usertype: newType,
                                })
                                if (resp.api_code === 200) {
                                  setUsers(users.map(u => u.userid === user.userid ? { ...u, usertype: newType } : u))
                                } else {
                                  alert('设置失败：' + resp.api_msg)
                                }
                              } catch (e) {
                                console.error(e)
                                alert('设置失败，请重试')
                              }
                            }}
                            className={`p-1 ${user.usertype == 1 ? 'text-gray-400 hover:text-gray-500' : 'text-purple-600 hover:text-purple-700'} transition-colors`}
                            title={user.usertype == 1 ? '取消大使' : '设为大使'}
                          >
                            {user.usertype == 1 ? (
                              <ToggleRight className="h-4 w-4" />
                            ) : (
                              <ToggleLeft className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.reg_date || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login_date || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingUser === user.userid ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => saveVipStatus(user.userid)}
                              disabled={updating}
                              className="p-1 text-green-600 hover:text-green-700 transition-colors"
                              title="保存"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={updating}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="取消"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => startEditVip(user)}
                              className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                              title="编辑VIP状态"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
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
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

