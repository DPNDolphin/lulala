'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { adminAPI } from '@/lib/adminAPI'
import AdminLayout from '@/components/AdminLayout'
import { 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  X
} from 'lucide-react'

interface AirdropItem {
  id: number
  name: string
  icon: string
  website?: string
  website_url?: string
  twitter_url?: string
  linkedin_url?: string
  whitepaper_url?: string
  status: 'draft' | 'published' | 'archived'
  featured: number
  is_vip: number
  heat_7d: number
  heat_30d: number
  heat_90d: number
  heat_total: number
  updated_at: string
}

export default function AdminAirdropsPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<AirdropItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')

  // 删除相关状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    item: AirdropItem | null
    loading: boolean
  }>({
    show: false,
    item: null,
    loading: false
  })

  const totalPages = useMemo(() => Math.max(1, pages), [pages])

  const loadList = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: any = {
        page,
        limit: pageSize,
        search: keyword,
        order: 'DESC',
        sort: 'updated_at'
      }
      if (status) params.status = status
      const res = await adminAPI.airdropsList(params)
      if (res.api_code == 200 && res.data) {
        setItems(res.data.airdrops || [])
        const p = res.data.pagination || { total: 0, pages: 1 }
        setTotal(p.total || 0)
        setPages(p.pages || 1)
      } else {
        setError(res.api_msg || '加载失败')
      }
    } catch (e: any) {
      setError(e?.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadList()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize])

  const onSearch = () => {
    setPage(1)
    loadList()
  }

  const handleDeleteClick = (item: AirdropItem) => {
    setDeleteConfirm({
      show: true,
      item,
      loading: false
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.item) return

    setDeleteConfirm(prev => ({ ...prev, loading: true }))
    
    try {
      const res = await adminAPI.airdropDelete(deleteConfirm.item.id)
      if (res.api_code == 200) {
        setDeleteConfirm({ show: false, item: null, loading: false })
        loadList()
      } else {
        alert(res.api_msg || '删除失败')
        setDeleteConfirm(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      alert('删除失败，请稍后重试')
      setDeleteConfirm(prev => ({ ...prev, loading: false }))
    }
  }

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, item: null, loading: false })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">空投管理</h1>
            <p className="text-gray-600 mt-2">管理所有空投项目</p>
          </div>
          <Link
            href="/admin/airdrops/create"
            className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>创建空投</span>
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={(e)=>{e.preventDefault(); onSearch();}} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜索项目名、网址..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                >
                  <option value="">全部状态</option>
                  <option value="published">已发布</option>
                  <option value="draft">草稿</option>
                  <option value="archived">已归档</option>
                </select>
              </div>

              <button
                type="submit"
                className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>筛选</span>
              </button>
            </div>
          </form>
        </div>

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无空投数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">项目</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">热度(7/30/90/总)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">更新时间</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {item.icon ? (
                            <img src={item.icon} alt="图标" className="w-12 h-12 rounded object-cover border border-gray-200 flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <span className="text-gray-400 text-xs">无图</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                              {item.is_vip === 1 && (
                                <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                                  VIP
                                </span>
                              )}
                              {item.featured === 1 && (
                                <span className="px-1.5 py-0.5 bg-pink-500 text-white text-xs font-semibold rounded-full">
                                  推荐
                                </span>
                              )}
                            </div>
                            <a className="text-xs text-blue-600 hover:underline" href={(item.website || item.website_url) || '#'} target="_blank" rel="noreferrer">{item.website || item.website_url || ''}</a>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {item.heat_7d}/{item.heat_30d}/{item.heat_90d}/{item.heat_total}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${item.status === 'published' ? 'bg-green-100 text-green-800' : item.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                          {item.status === 'published' ? '已发布' : item.status === 'draft' ? '草稿' : '已归档'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500 flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.updated_at).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/airdrops/${item.id}`}
                            target="_blank"
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="查看"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/airdrops/edit/${item.id}`}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="编辑"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-gray-700">显示第 {((page - 1) * pageSize) + 1} 到 {Math.min(page * pageSize, total)} 条，共 {total} 条</div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        page === pageNum 
                          ? 'bg-pink-500 text-white border-pink-500' 
                          : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm text-gray-700 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 删除确认对话框 */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">确认删除</h3>
                    <p className="text-sm text-gray-500">此操作不可撤销</p>
                  </div>
                </div>
                
                <div className="mb-6">
                  <p className="text-gray-700">
                    您确定要删除空投项目 <span className="font-semibold">"{deleteConfirm.item?.name}"</span> 吗？
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    删除后将同时删除相关的参与、评论和点赞数据。
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={cancelDelete}
                    disabled={deleteConfirm.loading}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={deleteConfirm.loading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {deleteConfirm.loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>删除中...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>确认删除</span>
                      </>
                    )}
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



