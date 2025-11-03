'use client'

import { useState, useEffect } from 'react'
import { User, Crown, ToggleLeft, ToggleRight, Search, Calendar, Filter, Edit3, Check, X, Plus, Eye, Trash2, AlertTriangle, Copy, Settings } from 'lucide-react'
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
  tradelevel: number
  trade_vailddate: number
  trade_expiry_date: string
  is_trade: boolean
  trade_expired: boolean
  reg_date: string
  last_login_date: string
  account_from_text: string
  accountfrom: number
  usertype?: number
  can_grant_trade_vip?: number
  can_publish_strategy?: number
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
  
  // 弹窗相关状态
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [updating, setUpdating] = useState(false)
  
  // 编辑表单数据
  const [editForm, setEditForm] = useState({
    viplevel: 0,
    vip_expiry_date: '',
    tradelevel: 0,
    trade_expiry_date: '',
    usertype: 0,
    can_grant_trade_vip: 0,
    can_publish_strategy: 0
  })

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
        if (params[key as keyof typeof params] == '') {
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

  // 开始编辑用户
  const startEditUser = (user: UserData) => {
    setEditingUser(user)
    
    // 格式化日期为 YYYY-MM-DD 格式
    const formatDateForInput = (dateStr: string) => {
      if (!dateStr) return ''
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    }
    
    setEditForm({
      viplevel: Number(user.viplevel || 0),
      vip_expiry_date: formatDateForInput(user.vip_expiry_date || ''),
      tradelevel: Number(user.tradelevel || 0),
      trade_expiry_date: formatDateForInput(user.trade_expiry_date || ''),
      usertype: Number(user.usertype || 0),
      can_grant_trade_vip: Number(user.can_grant_trade_vip || 0),
      can_publish_strategy: Number(user.can_publish_strategy || 0)
    })
    setShowEditModal(true)
  }

  // 关闭弹窗
  const closeModal = () => {
    setShowEditModal(false)
    setEditingUser(null)
    setEditForm({
      viplevel: 0,
      vip_expiry_date: '',
      tradelevel: 0,
      trade_expiry_date: '',
      usertype: 0,
      can_grant_trade_vip: 0,
      can_publish_strategy: 0
    })
  }

  // 保存用户设置
  const saveUserSettings = async () => {
    if (!editingUser) return
    
    try {
      setUpdating(true)
      
      // 同时更新VIP、交易等级和大使状态
      const vipResponse = await adminAPI.post('/v1/users/admin', {
        operation: 'update_vip',
        userid: editingUser.userid,
        viplevel: editForm.viplevel,
        vip_expiry_date: editForm.vip_expiry_date
      })
      
      const tradeResponse = await adminAPI.post('/v1/users/admin', {
        operation: 'update_trade_level',
        userid: editingUser.userid,
        trade_level: editForm.tradelevel,
        trade_expiry_date: editForm.trade_expiry_date
      })
      
      const usertypeResponse = await adminAPI.post('/v1/users/admin', {
        operation: 'update_usertype',
        userid: editingUser.userid,
        usertype: editForm.usertype
      })
      
      // 如果用户是大使，更新大使权限
      let ambassadorResponse = { api_code: 200 }
      if (editForm.usertype == 1) {
        ambassadorResponse = await adminAPI.post('/v1/users/admin', {
          operation: 'update_ambassador_permissions',
          userid: editingUser.userid,
          can_grant_trade_vip: editForm.can_grant_trade_vip,
          can_publish_strategy: editForm.can_publish_strategy
        })
      }
      
      if (vipResponse.api_code == 200 && tradeResponse.api_code == 200 && usertypeResponse.api_code == 200 && ambassadorResponse.api_code == 200) {
        // 更新本地数据
        setUsers(users.map(user => {
          if (user.userid == editingUser.userid) {
            return {
              ...user,
              viplevel: editForm.viplevel,
              vip_vailddate: vipResponse.data.vip_vailddate,
              vip_expiry_date: vipResponse.data.vip_expiry_date,
              is_vip: editForm.viplevel > 0 && vipResponse.data.vip_vailddate > Math.floor(Date.now() / 1000),
              vip_expired: vipResponse.data.vip_vailddate > 0 && vipResponse.data.vip_vailddate <= Math.floor(Date.now() / 1000),
              tradelevel: editForm.tradelevel,
              trade_vailddate: tradeResponse.data.trade_vailddate,
              trade_expiry_date: tradeResponse.data.trade_expiry_date,
              is_trade: editForm.tradelevel > 0 && tradeResponse.data.trade_vailddate > Math.floor(Date.now() / 1000),
              trade_expired: tradeResponse.data.trade_vailddate > 0 && tradeResponse.data.trade_vailddate <= Math.floor(Date.now() / 1000),
              usertype: editForm.usertype,
              can_grant_trade_vip: editForm.can_grant_trade_vip,
              can_publish_strategy: editForm.can_publish_strategy
            }
          }
          return user
        }))
        closeModal()
        alert('用户设置更新成功！')
      } else {
        alert('更新失败：' + (vipResponse.api_msg || tradeResponse.api_msg || usertypeResponse.api_msg))
      }
    } catch (error) {
      console.error('更新用户设置失败:', error)
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

  // 获取交易等级状态显示
  const getTradeStatusBadge = (user: UserData) => {
    if (user.is_trade) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <User className="h-3 w-3 mr-1" />
          交易VIP
        </span>
      )
    } else if (user.trade_expired) {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          已过期
        </span>
      )
    } else {
      return (
        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          非交易VIP
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
          ) : users.length == 0 ? (
            <div className="p-8 text-center text-gray-500">暂无用户数据</div>
          ) : (
            <div>
              <table className="w-full table-fixed break-words">
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
                      交易等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      交易到期时间
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
                        {getVipStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {user.vip_expiry_date || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getTradeStatusBadge(user)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {user.trade_expiry_date || '-'}
                        </span>
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
                                console.log('当前用户数据:', user)
                                console.log('当前usertype:', user.usertype, '类型:', typeof user.usertype)
                                const newType = user.usertype == 1 ? 0 : 1
                                console.log('新usertype:', newType)
                                const resp = await adminAPI.post('/v1/users/admin', {
                                  operation: 'update_usertype',
                                  userid: user.userid,
                                  usertype: newType,
                                })
                                if (resp.api_code == 200) {
                                  setUsers(users.map(u => u.userid == user.userid ? { ...u, usertype: newType } : u))
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
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => startEditUser(user)}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                            title="编辑用户设置"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
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
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}

        {/* 编辑用户弹窗 */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">编辑用户设置</h2>
                  <button
                    onClick={closeModal}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* 用户信息 */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">用户信息</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">用户ID:</span>
                        <span className="ml-2 font-mono text-gray-900">#{editingUser.userid}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">昵称:</span>
                        <span className="ml-2 text-gray-900">{editingUser.nickname || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-500">钱包地址:</span>
                        <span className="ml-2 font-mono text-xs text-gray-900">{formatWalletAddress(editingUser.wallet_address)}</span>
                      </div>
                    </div>
                  </div>

                  {/* VIP设置 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">投研VIP设置</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">VIP等级</label>
                        <select
                          value={editForm.viplevel}
                          onChange={(e) => setEditForm({...editForm, viplevel: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
                        >
                          <option value={0}>普通用户</option>
                          <option value={1}>VIP1</option>
                          <option value={2}>VIP2</option>
                          <option value={3}>VIP3</option>
                        </select>
                      </div>
                      {editForm.viplevel > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">到期日期</label>
                          <input
                            type="date"
                            value={editForm.vip_expiry_date}
                            onChange={(e) => setEditForm({...editForm, vip_expiry_date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 交易VIP设置 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">交易VIP设置</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">交易等级</label>
                        <select
                          value={editForm.tradelevel}
                          onChange={(e) => setEditForm({...editForm, tradelevel: Number(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
                        >
                          <option value={0}>非交易VIP</option>
                          <option value={1}>交易VIP</option>
                        </select>
                      </div>
                      {editForm.tradelevel > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">到期日期</label>
                          <input
                            type="date"
                            value={editForm.trade_expiry_date}
                            onChange={(e) => setEditForm({...editForm, trade_expiry_date: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:border-pink-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 大使设置 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">大使设置</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={editForm.usertype === 1}
                            onChange={(e) => setEditForm({...editForm, usertype: e.target.checked ? 1 : 0})}
                            className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">设为大使</span>
                        </label>
                      </div>
                      
                      {/* 大使权限设置 - 只有在大使状态下才显示 */}
                      {editForm.usertype === 1 && (
                        <div className="bg-blue-50 rounded-lg p-4 space-y-4">
                          <h4 className="text-md font-medium text-blue-900">大使权限设置</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={editForm.can_grant_trade_vip === 1}
                                onChange={(e) => setEditForm({...editForm, can_grant_trade_vip: e.target.checked ? 1 : 0})}
                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700">可以开通交易VIP</span>
                                <p className="text-xs text-gray-500">允许为用户开通交易VIP权限</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={editForm.can_publish_strategy === 1}
                                onChange={(e) => setEditForm({...editForm, can_publish_strategy: e.target.checked ? 1 : 0})}
                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                              />
                              <div>
                                <span className="text-sm font-medium text-gray-700">可以发布策略</span>
                                <p className="text-xs text-gray-500">允许发布交易策略</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveUserSettings}
                    disabled={updating}
                    className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? '保存中...' : '保存设置'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

