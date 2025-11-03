'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  Tag,
  TrendingUp,
  Heart,
  MessageCircle,
  AlertTriangle,
  Star,
  Settings
} from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import Link from 'next/link'

interface NewsArticle {
  id: number
  title: string
  excerpt: string
  category: string
  category_type: 'news' | 'newbie'
  section?: 'guide' | 'toolkit' | 'exchanges'
  image: string
  video_url?: string
  author: string
  read_time: string
  views: number
  comments: number
  featured: number
  status: 'published' | 'draft' | 'archived'
  published_at: string
  created_at: string
}

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

const statuses = ['全部', 'published', 'draft', 'archived']

export default function NewsManagement() {
  const router = useRouter()
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 分类数据
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  
  // 筛选和搜索
  const [search, setSearch] = useState('')
  const [categoryType, setCategoryType] = useState<'all' | 'news' | 'newbie'>('all')
  const [section, setSection] = useState<'all' | 'guide' | 'toolkit' | 'exchanges'>('all')
  const [category, setCategory] = useState('全部')
  const [status, setStatus] = useState('全部')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(0)

  // 删除相关状态
  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean
    article: NewsArticle | null
    loading: boolean
  }>({
    show: false,
    article: null,
    loading: false
  })

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true)
      const data = await adminAPI.get('/v1/news/categories?operation=list')
      
      if (data.api_code == 200) {
        setCategories(data.data.categories)
      }
    } catch (err) {
      console.error('获取分类列表失败:', err)
    } finally {
      setCategoriesLoading(false)
    }
  }

  const fetchArticles = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(category !== '全部' && { category }),
        ...(status !== '全部' && { status })
      })

      const data = await adminAPI.get(`/v1/news/articles?operation=list&${params}`)

      if (data.api_code == 200) {
        setArticles(data.data.articles)
        setTotal(data.data.pagination.total)
        setPages(data.data.pagination.pages)
      } else {
        setError(data.api_msg || '获取数据失败')
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

  useEffect(() => {
    fetchArticles()
  }, [page, search, category, status])

  // 当分类类型或板块变化时，重置分类选择
  useEffect(() => {
    setCategory('全部')
  }, [categoryType, section])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchArticles()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'archived':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return '已发布'
      case 'draft':
        return '草稿'
      case 'archived':
        return '已归档'
      default:
        return status
    }
  }

  const getCategoryTypeText = (type: 'news' | 'newbie') => {
    return type === 'news' ? '资讯' : '新手村'
  }

  const getSectionText = (section?: string) => {
    switch (section) {
      case 'guide':
        return '新手指南'
      case 'toolkit':
        return '工具包'
      case 'exchanges':
        return '交易所'
      default:
        return ''
    }
  }

  // 获取过滤后的分类列表
  const getFilteredCategories = () => {
    if (categoryType === 'all') return categories
    if (categoryType === 'newbie' && section !== 'all') {
      return categories.filter(cat => 
        cat.category_type === 'newbie' && cat.section === section
      )
    }
    return categories.filter(cat => cat.category_type === categoryType)
  }

  // 删除新闻
  const handleDeleteArticle = async () => {
    if (!deleteConfirm.article) return

    try {
      setDeleteConfirm(prev => ({ ...prev, loading: true }))
      
      const data = await adminAPI.post('/v1/news/articles?operation=delete', {
        id: deleteConfirm.article.id
      })

      if (data.api_code == 200) {
        await fetchArticles()
        setDeleteConfirm({ show: false, article: null, loading: false })
        setError('')
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
  const showDeleteConfirm = (article: NewsArticle) => {
    setDeleteConfirm({
      show: true,
      article: article,
      loading: false
    })
  }

  // 取消删除
  const cancelDelete = () => {
    setDeleteConfirm({
      show: false,
      article: null,
      loading: false
    })
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">新闻管理</h1>
            <p className="text-gray-600 mt-2">管理所有新闻文章</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/admin/news/categories"
              className="flex items-center space-x-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>分类管理</span>
            </Link>
            <Link
              href="/admin/news/create"
              className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>创建新闻</span>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* 第一行：分类类型和板块 */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Category Type Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">分类类型</label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value as 'all' | 'news' | 'newbie')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                >
                  <option value="all">全部</option>
                  <option value="news">新闻资讯</option>
                  <option value="newbie">新手村</option>
                </select>
              </div>

              {/* Section Filter (只在新手村时显示) */}
              {categoryType === 'newbie' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">新手村板块</label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value as 'all' | 'guide' | 'toolkit' | 'exchanges')}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  >
                    <option value="all">全部板块</option>
                    <option value="guide">新手指南</option>
                    <option value="toolkit">工具包</option>
                    <option value="exchanges">交易所</option>
                  </select>
                </div>
              )}

              {/* Category Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">具体分类</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={categoriesLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none disabled:bg-gray-100"
                >
                  <option value="全部">全部分类</option>
                  {getFilteredCategories().map(cat => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">状态</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                >
                  {statuses.map(stat => (
                    <option key={stat} value={stat}>
                      {stat === '全部' ? '全部状态' : getStatusText(stat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 第二行：搜索和筛选按钮 */}
            <div className="flex gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="搜索标题、摘要或内容..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>
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

          {/* Stats */}
          <div className="mt-4 text-sm text-gray-600">
            共找到 <span className="font-medium text-gray-900">{total}</span> 篇新闻
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Content List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">加载中...</div>
          ) : articles.length === 0 ? (
            <div className="p-8 text-center text-gray-500">暂无新闻数据</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      新闻标题
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型/板块
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      分类
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      统计数据
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      发布时间
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {articles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          {article.image ? (
                            <img 
                              src={article.image} 
                              alt="新闻图片" 
                              className="w-12 h-8 rounded object-cover border border-gray-200 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-200 flex-shrink-0">
                              <span className="text-gray-400 text-xs">无图</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {article.title}
                              </h3>
                              {article.featured && (
                                <div title="头条新闻">
                                  <Star className="h-4 w-4 text-yellow-500" />
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {article.excerpt}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <User className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{article.author}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            article.category_type === 'news' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {getCategoryTypeText(article.category_type)}
                          </span>
                          {article.section && (
                            <div>
                              <span className="inline-flex px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded">
                                {getSectionText(article.section)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${getStatusColor(article.status)}`}>
                          {getStatusText(article.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-3 w-3" />
                            <span>{article.views.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{article.comments}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(article.published_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/news?id=${article.id}`}
                            target="_blank"
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="查看新闻"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <Link
                            href={`/admin/news/edit/${article.id}`}
                            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                            title="编辑新闻"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button 
                            onClick={() => showDeleteConfirm(article)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors" 
                            title="删除新闻"
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
        {pages > 1 && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              显示第 {((page - 1) * 20) + 1} 到 {Math.min(page * 20, total)} 条，共 {total} 条
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      page === pageNum 
                        ? 'bg-pink-500 text-white border-pink-500' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    您确定要删除新闻 <span className="font-semibold">"{deleteConfirm.article?.title}"</span> 吗？
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    删除后将同时删除相关的评论数据。
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
                    onClick={handleDeleteArticle}
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
