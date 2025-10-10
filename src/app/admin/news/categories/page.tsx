'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import { 
  Plus, 
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  X,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'

interface NewsCategory {
  id: number
  name: string
  description: string
  sort_order: number
  status: 'active' | 'inactive'
  article_count: number
  created_at: string
  updated_at: string
  category_type?: 'news' | 'newbie'
  section?: 'guide' | 'toolkit' | 'exchanges'
}

export default function NewsCategoriesManagement() {
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // 表单状态
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<NewsCategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0,
    status: 'active' as 'active' | 'inactive',
    category_type: 'news' as 'news' | 'newbie',
    section: '' as '' | 'guide' | 'toolkit' | 'exchanges'
  })

  // 删除确认状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    category: NewsCategory | null
    loading: boolean
  }>({
    show: false,
    category: null,
    loading: false
  })

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await adminAPI.get('/v1/news/categories?operation=list')
      
      if (data.api_code == 200) {
        setCategories(data.data.categories)
      } else {
        setError(data.api_msg || '获取分类列表失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  // 处理表单输入
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sort_order: 0,
      status: 'active',
      category_type: 'news',
      section: ''
    })
    setEditingCategory(null)
    setShowForm(false)
  }

  // 显示创建表单
  const showCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  // 显示编辑表单
  const showEditForm = (category: NewsCategory) => {
    setFormData({
      name: category.name,
      description: category.description,
      sort_order: category.sort_order,
      status: category.status,
      category_type: category.category_type || 'news',
      section: category.section || ''
    })
    setEditingCategory(category)
    setShowForm(true)
  }

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const operation = editingCategory ? 'update' : 'create'
      const submitData = editingCategory 
        ? { id: editingCategory.id, ...formData }
        : formData

      const data = await adminAPI.post(`/v1/news/categories?operation=${operation}`, submitData)

      if (data.api_code == 200) {
        setSuccess(editingCategory ? '分类更新成功' : '分类创建成功')
        resetForm()
        await fetchCategories()
      } else {
        setError(data.api_msg || '操作失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 删除分类
  const handleDeleteCategory = async () => {
    if (!deleteConfirm.category) return

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }))
      
      const data = await adminAPI.post('/v1/news/categories?operation=delete', {
        id: deleteConfirm.category.id
      })

      if (data.api_code == 200) {
        setSuccess('分类删除成功')
        setDeleteConfirm({ show: false, category: null, loading: false })
        await fetchCategories()
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
  const showDeleteConfirm = (category: NewsCategory) => {
    setDeleteConfirm({
      show: true,
      category: category,
      loading: false
    })
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      category: null,
      loading: false
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">新闻分类管理</h1>
            <p className="text-gray-600 mt-2">管理新闻分类，包括创建、编辑、删除和排序</p>
          </div>
          <button
            onClick={showCreateForm}
            className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>创建分类</span>
          </button>
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

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingCategory ? '编辑分类' : '创建分类'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类名称 *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="请输入分类名称"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类描述
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="请输入分类描述"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      排序
                    </label>
                    <input
                      type="number"
                      name="sort_order"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      分类类型
                    </label>
                    <select
                      name="category_type"
                      value={formData.category_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    >
                      <option value="news">普通资讯</option>
                      <option value="newbie">新手村</option>
                    </select>
                  </div>

                  {formData.category_type === 'newbie' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        新手村板块
                      </label>
                      <select
                        name="section"
                        value={formData.section}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      >
                        <option value="">请选择板块</option>
                        <option value="guide">新手指南</option>
                        <option value="toolkit">工具包</option>
                        <option value="exchanges">交易所</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      状态
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    >
                      <option value="active">启用</option>
                      <option value="inactive">禁用</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors"
                    >
                      {editingCategory ? '更新' : '创建'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : categories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无分类数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      排序
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文章数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      创建时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900">
                            {category.name}
                          </h3>
                          {category.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {category.description}
                            </p>
                          )}
                          {category.category_type === 'newbie' && category.section && (
                            <p className="text-xs text-pink-600 mt-1">
                              板块: {category.section === 'guide' ? '新手指南' : 
                                     category.section === 'toolkit' ? '工具包' : 
                                     category.section === 'exchanges' ? '交易所' : category.section}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${
                          category.category_type === 'newbie' 
                            ? 'bg-pink-100 text-pink-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {category.category_type === 'newbie' ? '新手村' : '普通资讯'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {category.sort_order}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${
                          category.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {category.status === 'active' ? '启用' : '禁用'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">
                          {category.article_count} 篇
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(category.created_at).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => showEditForm(category)}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="编辑分类"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => showDeleteConfirm(category)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="删除分类"
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
                    您确定要删除分类 <span className="font-semibold">"{deleteConfirm.category?.name}"</span> 吗？
                  </p>
                  {deleteConfirm.category && deleteConfirm.category.article_count > 0 && (
                    <p className="text-sm text-red-600 mt-2">
                      该分类下还有 {deleteConfirm.category.article_count} 篇新闻，删除前请先处理这些新闻。
                    </p>
                  )}
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
                    onClick={handleDeleteCategory}
                    disabled={deleteConfirm.loading || (deleteConfirm.category?.article_count && deleteConfirm.category.article_count > 0) || false}
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
