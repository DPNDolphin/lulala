'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { 
  Search, 
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  AlertTriangle,
  MessageCircle,
  User,
  Calendar,
  ThumbsUp
} from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'

interface Comment {
  id: number
  report_id: number
  user_id: number
  content: string
  likes: number
  parent_id: number
  status: 'pending' | 'approved' | 'rejected'
  ip_address: string
  created_at: string
  updated_at: string
  report_title: string
  user: {
    nickname: string
    avatar: string
    wallet_address: string
  }
}

export default function ResearchCommentsManagement() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // 筛选状态
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    report_id: ''
  })
  
  // 分页状态
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    comment: Comment | null
    loading: boolean
  }>({
    show: false,
    comment: null,
    loading: false
  })

  // 获取评论列表
  const fetchComments = async () => {
    try {
      setLoading(true)
      setError('')
      
      const params: Record<string, any> = {
        page: pagination.page,
        limit: pagination.limit
      }
      
      if (filters.search) {
        params.search = filters.search
      }
      
      if (filters.status) {
        params.status = filters.status
      }
      
      if (filters.report_id) {
        params.report_id = filters.report_id
      }
      
      const data = await adminAPI.get('/v1/research/adminComments?operation=list', params)
      
      if (data.api_code == 200) {
        setComments(data.data.comments)
        setPagination(prev => ({
          ...prev,
          total: data.data.pagination.total,
          pages: data.data.pagination.pages
        }))
      } else {
        setError(data.api_msg || '获取评论列表失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [pagination.page, filters])

  // 处理搜索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchComments()
  }

  // 处理筛选
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  // 更新评论状态
  const handleStatusUpdate = async (commentId: number, status: string) => {
    try {
      const data = await adminAPI.post('/v1/research/adminComments?operation=update', {
        id: commentId,
        status: status
      })

      if (data.api_code == 200) {
        setSuccess(`评论状态已更新为${status === 'approved' ? '已审核' : status === 'rejected' ? '已拒绝' : '待审核'}`)
        await fetchComments()
      } else {
        setError(data.api_msg || '状态更新失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 删除评论
  const handleDeleteComment = async () => {
    if (!deleteConfirm.comment) return

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }))
      
      const data = await adminAPI.post('/v1/research/adminComments?operation=delete', {
        id: deleteConfirm.comment.id
      })

      if (data.api_code == 200) {
        setSuccess('评论删除成功')
        setDeleteConfirm({ show: false, comment: null, loading: false })
        await fetchComments()
      } else {
        setError(data.api_msg || '删除失败')
        setDeleteConfirm(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      setDeleteConfirm(prev => ({ ...prev, loading: false }))
    }
  }

  // 显示删除确认对话框
  const showDeleteConfirm = (comment: Comment) => {
    setDeleteConfirm({
      show: true,
      comment: comment,
      loading: false
    })
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      comment: null,
      loading: false
    })
  }

  // 获取状态显示文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待审核'
      case 'approved': return '已审核'
      case 'rejected': return '已拒绝'
      default: return status
    }
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">评论管理</h1>
            <p className="text-gray-600 mt-2">管理所有评论内容</p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-green-700">{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    placeholder="搜索评论内容、作者..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                >
                  <option value="">全部状态</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已审核</option>
                  <option value="rejected">已拒绝</option>
                </select>
                
                <button
                  type="submit"
                  className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Search className="h-4 w-4" />
                  <span>搜索</span>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Comments List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : comments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无评论数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      评论信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      统计
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {comments.map((comment) => (
                    <tr key={comment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{comment.user.nickname}</span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{comment.content}</p>
                          <p className="text-xs text-gray-400 mt-1">IP: {comment.ip_address}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${getStatusColor(comment.status)}`}>
                          {getStatusText(comment.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{comment.likes}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(comment.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {comment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(comment.id, 'approved')}
                                className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                title="审核通过"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(comment.id, 'rejected')}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="拒绝"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {comment.status === 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(comment.id, 'rejected')}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="拒绝"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                          {comment.status === 'rejected' && (
                            <button
                              onClick={() => handleStatusUpdate(comment.id, 'approved')}
                              className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                              title="审核通过"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => showDeleteConfirm(comment)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除评论"
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
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示第 {(pagination.page - 1) * pagination.limit + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="px-3 py-2 text-gray-700">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}

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
                    您确定要删除这条评论吗？
                  </p>
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>作者:</strong> {deleteConfirm.comment?.user.nickname}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>内容:</strong> {deleteConfirm.comment?.content}
                    </p>
                  </div>
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
                    onClick={handleDeleteComment}
                    disabled={deleteConfirm.loading}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {deleteConfirm.loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
