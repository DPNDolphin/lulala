'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { 
  Save, 
  Eye, 
  X, 
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  Tag as TagIcon,
  Star,
  ArrowLeft
} from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDEditorMarkdown = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false })

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

export default function EditNews() {
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [categories, setCategories] = useState<NewsCategory[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    category_type: 'news' as 'news' | 'newbie',
    section: '' as '' | 'guide' | 'toolkit' | 'exchanges',
    image: '',
    video_url: '',
    author: 'LULALA团队',
    read_time: '3分钟',
    featured: false,
    status: 'published',
    published_at: new Date().toISOString().slice(0, 16)
  })

  // 文件 input 引用，确保选择相同文件也能触发 onChange
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // 获取新闻详情
  const fetchArticleDetail = async () => {
    try {
      setFetching(true)
      setError('')
      const data = await adminAPI.get(`/v1/news/articles?operation=detail&id=${articleId}`)
      
      if (data.api_code == 200) {
        const article = data.data
        setFormData({
          title: article.title || '',
          excerpt: article.excerpt || '',
          content: article.content || '',
          category: article.category || '重大新闻',
          category_type: article.category_type || 'news',
          section: article.section || '',
          image: article.image || '',
          video_url: article.video_url || '',
          author: article.author || 'LULALA团队',
          read_time: article.read_time || '3分钟',
          featured: article.featured === 1,
          status: article.status || 'published',
          published_at: article.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
        })
      } else {
        setError(data.api_msg || '获取新闻详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (articleId) {
      fetchArticleDetail()
    }
  }, [articleId])

  // 当分类类型或板块变化时，更新分类选择
  useEffect(() => {
    if (categories.length > 0) {
      const filteredCategories = categories.filter(cat => 
        formData.category_type === 'newbie' 
          ? cat.category_type === 'newbie' && (!formData.section || cat.section === formData.section)
          : cat.category_type === 'news'
      )
      
      // 检查当前选中的分类是否在筛选后的列表中
      const currentCategoryExists = filteredCategories.some(cat => cat.name === formData.category)
      
      // 如果当前分类不在列表中，选择第一个分类
      if (!currentCategoryExists && filteredCategories.length > 0) {
        setFormData(prev => ({
          ...prev,
          category: filteredCategories[0].name
        }))
      }
    }
  }, [formData.category_type, formData.section, categories])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleContentChange = (value?: string) => {
    setFormData(prev => ({
      ...prev,
      content: value || ''
    }))
  }

  // 在光标位置插入图片
  const insertImageAtCursor = (imageUrl: string, altText: string = '粘贴的图片') => {
    const imageMarkdown = `![${altText}](${imageUrl})`
    let textarea: HTMLTextAreaElement | null = null
    let start = 0
    let end = 0
    textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement
    if (!textarea) textarea = document.querySelector('.w-md-editor .w-md-editor-text-input') as HTMLTextAreaElement
    if (!textarea) textarea = document.querySelector('.w-md-editor textarea') as HTMLTextAreaElement
    if (!textarea) {
      textarea = document.activeElement as HTMLTextAreaElement
      if (!textarea || textarea.tagName !== 'TEXTAREA') textarea = null
    }
    const currentContent = formData.content
    if (textarea && textarea.selectionStart !== undefined && textarea.selectionEnd !== undefined) {
      start = textarea.selectionStart
      end = textarea.selectionEnd
      const beforeCursor = currentContent.substring(0, start)
      const afterCursor = currentContent.substring(end)
      const needsNewlineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      const needsNewlineAfter = afterCursor.length > 0 && !afterCursor.startsWith('\n')
      const newContent = beforeCursor + (needsNewlineBefore ? '\n' : '') + imageMarkdown + (needsNewlineAfter ? '\n' : '') + afterCursor
      handleContentChange(newContent)
      setTimeout(() => {
        const newCursorPos = start + (needsNewlineBefore ? 1 : 0) + imageMarkdown.length + (needsNewlineAfter ? 1 : 0)
        if (textarea) {
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }
      }, 100)
    } else {
      const newContent = currentContent + '\n' + imageMarkdown
      handleContentChange(newContent)
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl
    }))
  }

  // 处理编辑器图片上传
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await fetch('/v1/upload/editorImage', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('admin_token') || ''
        },
        body: formData
      })

      const data = await response.json()

      if (data.api_code == 200) {
        return data.data.url
      } else {
        throw new Error(data.api_msg || '上传失败')
      }
    } catch (err) {
      throw new Error('网络错误，请稍后重试')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        id: parseInt(articleId),
        ...formData,
        featured: formData.featured ? 1 : 0
      }

      const data = await adminAPI.post('/v1/news/articles?operation=update', submitData)

      if (data.api_code == 200) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/news')
        }, 2000)
      } else {
        setError(data.api_msg || '更新失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = () => {
    setPreviewMode(!previewMode)
  }

  // 加载状态
  if (fetching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">加载中...</h2>
            <p className="text-gray-600">正在获取新闻详情</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // 成功状态
  if (success) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">新闻更新成功！</h2>
            <p className="text-gray-600">正在跳转到新闻管理页面...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <button
                onClick={() => router.back()}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>返回</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">编辑新闻</h1>
            <p className="text-gray-600 mt-2">修改新闻文章内容</p>
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>{previewMode ? '编辑' : '预览'}</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Form */}
        {!previewMode ? (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新闻标题 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入新闻标题"
                  />
                </div>

                {/* Excerpt */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新闻摘要 *
                  </label>
                  <textarea
                    name="excerpt"
                    value={formData.excerpt}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入新闻摘要"
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    新闻图片
                  </label>
                  <ImageUploader 
                    onUpload={handleImageUpload}
                    currentImage={formData.image}
                    className="w-full max-w-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">如果有视频，图片将被视频替代</p>
                </div>

                {/* Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    视频地址（选填）
                  </label>
                  <input
                    type="url"
                    name="video_url"
                    value={formData.video_url}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入视频嵌入地址，如YouTube或Bilibili的embed链接"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    示例：https://www.youtube.com/embed/VIDEO_ID 或 https://player.bilibili.com/player.html?bvid=BV_ID
                  </p>
                </div>

                {/* Category Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类类型 *
                  </label>
                  <select
                    name="category_type"
                    value={formData.category_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  >
                    <option value="news">普通资讯</option>
                    <option value="newbie">新手村</option>
                  </select>
                </div>

                {/* Section (for newbie) */}
                {formData.category_type === 'newbie' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      新手村板块 *
                    </label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    >
                      <option value="">请选择板块</option>
                      <option value="guide">新手指南</option>
                      <option value="toolkit">工具包</option>
                      <option value="exchanges">交易所</option>
                    </select>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    disabled={categoriesLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none disabled:bg-gray-100"
                  >
                    {categoriesLoading ? (
                      <option>加载中...</option>
                    ) : (
                      categories
                        .filter(cat => 
                          formData.category_type === 'newbie' 
                            ? cat.category_type === 'newbie' && (!formData.section || cat.section === formData.section)
                            : cat.category_type === 'news'
                        )
                        .map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))
                    )}
                  </select>
                </div>

                {/* Author */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    作者
                  </label>
                  <input
                    type="text"
                    name="author"
                    value={formData.author}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="LULALA团队"
                  />
                </div>

                {/* Read Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    阅读时间
                  </label>
                  <input
                    type="text"
                    name="read_time"
                    value={formData.read_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="3分钟"
                  />
                </div>

                {/* Status */}
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
                    <option value="published">已发布</option>
                    <option value="draft">草稿</option>
                  </select>
                </div>

                {/* Published At */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    发布时间
                  </label>
                  <input
                    type="datetime-local"
                    name="published_at"
                    value={formData.published_at}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                  />
                </div>

                {/* Featured */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                    />
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">设为头条新闻</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">新闻内容</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容 * (Markdown格式)
                </label>
                <div data-color-mode="light">
                  {/* 图片上传按钮 */}
                  <div className="mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        try {
                          const imageUrl = await handleEditorImageUpload(file)
                          insertImageAtCursor(imageUrl, file.name)
                        } catch (error) {
                          setError(error instanceof Error ? error.message : '图片上传失败')
                        } finally {
                          e.currentTarget.value = ''
                        }
                      }}
                      className="hidden"
                      id="news-editor-image-upload-edit"
                    />
                    <label
                      htmlFor="news-editor-image-upload-edit"
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer transition-colors"
                      onClick={() => {
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      插入图片
                    </label>
                    <span className="ml-2 text-xs text-gray-500">支持拖拽图片到编辑器或粘贴图片</span>
                  </div>
                  
                  <MDEditor
                    value={formData.content}
                    onChange={handleContentChange}
                    height={400}
                    preview="edit"
                    data-color-mode="light"
                    onDrop={async (event) => {
                      event.preventDefault()
                      const files = Array.from(event.dataTransfer.files)
                      const imageFiles = files.filter(file => file.type.startsWith('image/'))
                      
                      if (imageFiles.length > 0) {
                        const file = imageFiles[0]
                        try {
                          const imageUrl = await handleEditorImageUpload(file)
                          insertImageAtCursor(imageUrl, file.name)
                        } catch (error) {
                          setError(error instanceof Error ? error.message : '图片上传失败')
                        }
                      }
                    }}
                    onPaste={async (event) => {
                      const items = Array.from(event.clipboardData?.items || [])
                      const imageItems = items.filter(item => item.type.startsWith('image/'))
                      
                      if (imageItems.length > 0) {
                        event.preventDefault()
                        const file = imageItems[0].getAsFile()
                        if (file) {
                          try {
                            const imageUrl = await handleEditorImageUpload(file)
                            insertImageAtCursor(imageUrl, '粘贴的图片')
                          } catch (error) {
                            setError(error instanceof Error ? error.message : '图片上传失败')
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? '更新中...' : '更新新闻'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              <div className="flex items-center space-x-3 mb-6">
                {formData.image ? (
                  <img 
                    src={formData.image} 
                    alt="新闻图片" 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-400 text-sm">无图片</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title || '未填写标题'}</h1>
                    {formData.featured && (
                      <div title="头条新闻">
                        <Star className="h-6 w-6 text-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formData.author}</span>
                    <span>•</span>
                    <span>{formData.read_time}</span>
                    <span>•</span>
                    <span>{new Date(formData.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <span className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm font-medium">
                  {formData.category}
                </span>
              </div>
              
              <p className="text-lg text-gray-600 mb-6">{formData.excerpt || '未填写摘要'}</p>
              
              <div className="markdown-content">
                <MDEditorMarkdown source={formData.content || '未填写内容'} />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
