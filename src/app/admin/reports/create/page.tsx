'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AdminLayout from '@/components/AdminLayout'
import { 
  Save, 
  Eye, 
  X, 
  Plus,
  FileText,
  AlertCircle,
  CheckCircle,
  Tag as TagIcon
} from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDEditorMarkdown = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false })

export default function CreateReport() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const categoryParam = searchParams?.get('category') || ''
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewMode, setPreviewMode] = useState(false)
  const [commonTags, setCommonTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content: '',
    tags: [] as string[],
    iconUrl: '',
    videoUrl: '',
    author: 'LULALA团队',
    status: 'published',
    isVipOnly: false
  })

  const [newTag, setNewTag] = useState('')

  // 获取常用标签
  const fetchCommonTags = async () => {
    try {
      setTagsLoading(true)
      const data = await adminAPI.get('/v1/research/tags')
      if (data.api_code == 200) {
        setCommonTags(data.data.tags || [])
      }
    } catch (err) {
      console.error('获取常用标签失败:', err)
    } finally {
      setTagsLoading(false)
    }
  }

  // 文件 input 引用，保证选择相同文件也能触发 onChange
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchCommonTags()
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
    
    // 尝试多种方式获取当前光标位置
    let textarea: HTMLTextAreaElement | null = null
    let start = 0
    let end = 0
    
    // 方法1: 尝试获取MDEditor的textarea
    textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement
    if (!textarea) {
      // 方法2: 尝试获取MDEditor容器内的textarea
      textarea = document.querySelector('.w-md-editor .w-md-editor-text-input') as HTMLTextAreaElement
    }
    if (!textarea) {
      // 方法3: 尝试获取任何在MDEditor容器内的textarea
      textarea = document.querySelector('.w-md-editor textarea') as HTMLTextAreaElement
    }
    if (!textarea) {
      // 方法4: 尝试获取当前活跃的textarea
      textarea = document.activeElement as HTMLTextAreaElement
      if (!textarea || textarea.tagName !== 'TEXTAREA') {
        textarea = null
      }
    }
    
    if (textarea) {
      start = textarea.selectionStart
      end = textarea.selectionEnd
      console.log('找到textarea，光标位置:', start, end)
    } else {
      console.log('未找到textarea，使用末尾插入')
    }
    
    const currentContent = formData.content
    
    if (textarea && start !== undefined && end !== undefined) {
      // 在光标位置插入图片，前后加换行确保格式正确
      const beforeCursor = currentContent.substring(0, start)
      const afterCursor = currentContent.substring(end)
      
      // 如果光标前没有换行，添加换行
      const needsNewlineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      // 如果光标后没有换行，添加换行
      const needsNewlineAfter = afterCursor.length > 0 && !afterCursor.startsWith('\n')
      
      const newContent = beforeCursor + 
        (needsNewlineBefore ? '\n' : '') + 
        imageMarkdown + 
        (needsNewlineAfter ? '\n' : '') + 
        afterCursor
      
      console.log('在光标位置插入图片:', {
        beforeCursor: beforeCursor.slice(-20),
        afterCursor: afterCursor.slice(0, 20),
        newContent: newContent.slice(start - 10, start + imageMarkdown.length + 20)
      })
      
      handleContentChange(newContent)
      
      // 设置新的光标位置（在插入的图片后面）
      setTimeout(() => {
        const newCursorPos = start + (needsNewlineBefore ? 1 : 0) + imageMarkdown.length + (needsNewlineAfter ? 1 : 0)
        if (textarea) {
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }
      }, 100)
    } else {
      // 如果找不到textarea或光标位置，回退到原来的逻辑
      console.log('回退到末尾插入')
      const newContent = currentContent + '\n' + imageMarkdown
      handleContentChange(newContent)
    }
  }

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      iconUrl: imageUrl
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

  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        tags: formData.tags.join(','),
        icon: formData.iconUrl, // 后端仍使用icon字段名
        video_url: formData.videoUrl, // 后端使用video_url字段名
        is_vip_only: formData.isVipOnly ? 1 : 0 // 转换为数字
      }
      delete (submitData as any).iconUrl // 删除iconUrl字段
      delete (submitData as any).videoUrl // 删除videoUrl字段
      delete (submitData as any).isVipOnly // 删除前端字段名

      const data = await adminAPI.post('/v1/research/create', submitData)

      if (data.api_code == 200) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/admin/content${categoryParam ? `?category=${categoryParam}` : ''}`)
        }, 1000)
      } else {
        setError(data.api_msg || '创建失败')
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

  if (success) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">报告创建成功！</h2>
            <p className="text-gray-600">正在跳转到内容管理页面...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">创建新报告</h1>
            <p className="text-gray-600 mt-2">创建一份新的投研报告</p>
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
                    报告标题 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入报告标题"
                  />
                </div>

                {/* Icon Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目图标
                  </label>
                  <ImageUploader 
                    onUpload={handleImageUpload}
                    currentImage={formData.iconUrl}
                    className="w-full max-w-sm"
                  />
                </div>

                {/* Video URL */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    视频地址 (可选)
                  </label>
                  <input
                    type="url"
                    name="videoUrl"
                    value={formData.videoUrl}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入YouTube嵌入地址，如：https://www.youtube.com/embed/xxxxxxx"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    <p>• 支持YouTube嵌入地址</p>
                    <p>• 例如：https://www.youtube.com/embed/dQw4w9WgXcQ</p>
                  </div>
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

                {/* VIP Only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VIP专享
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isVipOnly"
                        checked={!formData.isVipOnly}
                        onChange={() => setFormData({...formData, isVipOnly: false})}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">普通内容</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="isVipOnly"
                        checked={formData.isVipOnly}
                        onChange={() => setFormData({...formData, isVipOnly: true})}
                        className="w-4 h-4 text-pink-600 bg-gray-100 border-gray-300 focus:ring-pink-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">VIP专享</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    VIP专享内容只有VIP会员才能查看完整内容
                  </p>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    描述 *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                    placeholder="请输入报告描述"
                  />
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签
                  </label>
                  
                  {/* Selected Tags */}
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 bg-pink-100 text-pink-800 text-sm rounded-full"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-pink-600 hover:text-pink-800"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Common Tags */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-2">常用标签（点击添加）：</p>
                    {tagsLoading ? (
                      <div className="text-xs text-gray-500">加载中...</div>
                    ) : commonTags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {commonTags.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            disabled={formData.tags.includes(tag)}
                            className={`px-3 py-1 text-sm border rounded-lg transition-colors ${
                              formData.tags.includes(tag)
                                ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                : 'border-gray-300 text-gray-700 hover:border-pink-400 hover:bg-pink-50'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">暂无常用标签</div>
                    )}
                  </div>

                  {/* Custom Tag Input */}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag(newTag))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none"
                      placeholder="输入自定义标签"
                    />
                    <button
                      type="button"
                      onClick={() => addTag(newTag)}
                      className="flex items-center space-x-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>添加</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">报告内容</h2>
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
                          // 在光标位置插入，避免光标跳动
                          insertImageAtCursor(imageUrl, file.name)
                        } catch (error) {
                          setError(error instanceof Error ? error.message : '图片上传失败')
                        } finally {
                          // 重置 input，允许重复选择同一文件
                          e.currentTarget.value = ''
                        }
                      }}
                      className="hidden"
                      id="report-editor-image-upload-create"
                    />
                    <label
                      htmlFor="report-editor-image-upload-create"
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer transition-colors"
                      onClick={() => {
                        // 确保每次点击前都重置，兼容选择相同文件
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
                          // 在光标位置插入
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
                            // 使用新的插入函数，支持在光标位置插入
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
                <span>{loading ? '创建中...' : '创建报告'}</span>
              </button>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="prose prose-lg max-w-none">
              <div className="flex items-center space-x-3 mb-6">
                {formData.iconUrl ? (
                  <img 
                    src={formData.iconUrl} 
                    alt="项目图标" 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-400 text-sm">无图标</span>
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{formData.title || '未填写标题'}</h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>{formData.author}</span>
                    <span>•</span>
                    <span>{new Date().toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-gray-600 mb-6">{formData.description || '未填写描述'}</p>
              
              {/* 视频预览 */}
              {formData.videoUrl && (
                <div className="mb-6">
                  <div className="aspect-video">
                    <iframe
                      src={formData.videoUrl}
                      className="w-full h-full rounded-lg border border-gray-200"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="报告视频"
                    ></iframe>
                  </div>
                </div>
              )}
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              
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