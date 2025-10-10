'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import ImageUploader from '@/components/ImageUploader'
import { adminAPI } from '@/lib/adminAPI'
import { useRouter } from 'next/navigation'
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
  ArrowLeft
} from 'lucide-react'

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDEditorMarkdown = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false })

export default function AdminAirdropCreatePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [previewMode, setPreviewMode] = useState(false)

  const [formData, setFormData] = useState({
    icon: '',
    name: '',
    website: '',
    twitter_url: '',
    linkedin_url: '',
    whitepaper_url: '',
    tags: [] as string[],
    description: '',
    content: '',
    status: 'published',
    is_vip: 0
  })

  // 统一标签管理（与投研一致）
  const [commonTags, setCommonTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
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

  useEffect(() => {
    fetchCommonTags()
  }, [])

  // 避免水合与首渲染抖动：仅在挂载后再渲染编辑器
  const [editorReady, setEditorReady] = useState(false)
  useEffect(() => { setEditorReady(true) }, [])

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, trimmedTag] }))
    }
  }

  // 移除标签
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContentChange = (value: string | undefined) => {
    setFormData(prev => ({ ...prev, content: value || '' }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)
    
    try {
      const payload = { ...formData }
      const res = await adminAPI.airdropCreate(payload)
      if (res.api_code == 200) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/admin/airdrops')
        }, 1500)
      } else {
        setError(res.api_msg || '创建失败')
      }
    } catch (e: any) {
      setError(e?.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  // 编辑器图片上传，与项目内现有实现保持一致
  const handleEditorImageUpload = async (file: File): Promise<string> => {
    const fd = new FormData()
    fd.append('image', file)
    try {
      const resp = await fetch('/v1/upload/editorImage', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('admin_token') || ''
        },
        body: fd
      })
      const data = await resp.json()
      if (data.api_code == 200) {
        return data.data.url
      }
      throw new Error(data.api_msg || '上传失败')
    } catch (err) {
      throw new Error('网络错误，请稍后重试')
    }
  }

  // 添加全局粘贴事件监听
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (previewMode) return
      
      const items = Array.from(e.clipboardData?.items || [])
      const imageItems = items.filter(item => item.type.startsWith('image/'))
      
      if (imageItems.length > 0) {
        e.preventDefault()
        const file = imageItems[0].getAsFile()
        if (file) {
          try {
            const imageUrl = await handleEditorImageUpload(file)
            const imageMarkdown = `![粘贴的图片](${imageUrl})`
            const currentContent = formData.content
            const newContent = currentContent + '\n' + imageMarkdown
            setTimeout(() => {
              handleContentChange(newContent)
            }, 100)
          } catch (error) {
            setError(error instanceof Error ? error.message : '图片上传失败')
          }
        }
      }
    }
    
    document.addEventListener('paste', handleGlobalPaste)
    return () => document.removeEventListener('paste', handleGlobalPaste)
  }, [formData.content, previewMode])

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <button
              onClick={() => router.push('/admin/airdrops')}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>返回</span>
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">创建空投项目</h1>
              <p className="text-gray-600 mt-2">填写项目信息并发布</p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{previewMode ? '编辑' : '预览'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2 text-green-700">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>创建成功！正在跳转...</span>
          </div>
        )}

        {!previewMode ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">基本信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">项目图标</label>
                  <ImageUploader currentImage={formData.icon} onUpload={(url) => setFormData(prev => ({ ...prev, icon: url }))} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    项目名称 *
                  </label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">项目网址</label>
                  <input 
                    name="website" 
                    value={formData.website} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none" 
                    placeholder="https://..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">X 链接</label>
                  <input 
                    name="twitter_url" 
                    value={formData.twitter_url} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none" 
                    placeholder="https://x.com/..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn 链接</label>
                  <input 
                    name="linkedin_url" 
                    value={formData.linkedin_url} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none" 
                    placeholder="https://linkedin.com/..." 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">白皮书链接</label>
                  <input 
                    name="whitepaper_url" 
                    value={formData.whitepaper_url} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:outline-none" 
                    placeholder="https://..." 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    简介 *
                  </label>
                  <textarea 
                    name="description" 
                    value={formData.description} 
                    onChange={handleInputChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg h-28 focus:border-pink-500 focus:outline-none" 
                    placeholder="请输入项目简介..."
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VIP项目
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_vip"
                        value="0"
                        checked={formData.is_vip === 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_vip: parseInt(e.target.value) }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">普通项目</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="is_vip"
                        value="1"
                        checked={formData.is_vip === 1}
                        onChange={(e) => setFormData(prev => ({ ...prev, is_vip: parseInt(e.target.value) }))}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">VIP项目</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">VIP项目仅对VIP用户可见</p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">标签管理</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <TagIcon className="h-4 w-4" />
                  <span>标签</span>
                </label>
                
                {/* 已选标签 */}
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {formData.tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-pink-100 text-pink-800 rounded-full">
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => removeTag(tag)}
                          className="text-pink-600 hover:text-pink-800 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* 新增标签 */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const trimmedTag = newTag.trim()
                        addTag(trimmedTag)
                        setNewTag('')
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                    placeholder="输入标签后按回车添加"
                  />
                  <button 
                    type="button" 
                    onClick={() => {
                      addTag(newTag)
                      setNewTag('')
                    }}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>添加</span>
                  </button>
                </div>
                
                {/* 常用标签 */}
                {!tagsLoading && commonTags.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">常用标签：</p>
                    <div className="flex flex-wrap gap-2">
                      {commonTags.map(tag => (
                        <button 
                          type="button" 
                          key={tag} 
                          onClick={() => addTag(tag)}
                          disabled={formData.tags.includes(tag)}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">项目介绍</h2>

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
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          try {
                            const imageUrl = await handleEditorImageUpload(file)
                            const imageMarkdown = `![${file.name}](${imageUrl})`
                            const currentContent = formData.content
                            const newContent = currentContent + '\n' + imageMarkdown
                            // 使用setTimeout确保状态更新
                            setTimeout(() => {
                              handleContentChange(newContent)
                            }, 100)
                            // 清空input
                            e.target.value = ''
                          } catch (error) {
                            setError(error instanceof Error ? error.message : '图片上传失败')
                          }
                        }
                      }}
                      className="hidden"
                      id="airdrop-editor-image-upload"
                    />
                    <label
                      htmlFor="airdrop-editor-image-upload"
                      className="inline-flex items-center px-3 py-1 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded cursor-pointer transition-colors"
                    >
                      插入图片
                    </label>
                    <span className="ml-2 text-xs text-gray-500">支持拖拽或粘贴图片</span>
                  </div>
                  
                  {editorReady && (
                    <MDEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      height={420}
                      preview="edit"
                      data-color-mode="light"
                      onDrop={async (event: React.DragEvent) => {
                        event.preventDefault()
                        const files = Array.from(event.dataTransfer.files)
                        const imageFiles = files.filter(f => f.type.startsWith('image/'))
                        if (imageFiles.length > 0) {
                          const file = imageFiles[0]
                          try {
                            const imageUrl = await handleEditorImageUpload(file)
                            const imageMarkdown = `![${file.name}](${imageUrl})`
                            const currentContent = formData.content
                            const newContent = currentContent + '\n' + imageMarkdown
                            setTimeout(() => {
                              handleContentChange(newContent)
                            }, 100)
                          } catch (error) {
                            setError(error instanceof Error ? error.message : '图片上传失败')
                          }
                        }
                      }}
                      onPaste={async (event: React.ClipboardEvent) => {
                        const items = Array.from(event.clipboardData?.items || [])
                        const imageItems = items.filter(it => it.type.startsWith('image/'))
                        if (imageItems.length > 0) {
                          event.preventDefault()
                          const file = imageItems[0].getAsFile()
                          if (file) {
                            try {
                              const imageUrl = await handleEditorImageUpload(file)
                              const imageMarkdown = `![粘贴的图片](${imageUrl})`
                              const currentContent = formData.content
                              const newContent = currentContent + '\n' + imageMarkdown
                              setTimeout(() => {
                                handleContentChange(newContent)
                              }, 100)
                            } catch (error) {
                              setError(error instanceof Error ? error.message : '图片上传失败')
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => router.push('/admin/airdrops')}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>取消</span>
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{loading ? '创建中...' : '创建项目'}</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* Preview Mode */
          <div className="space-y-6">
            {/* Basic Info Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">项目预览</h2>
              
              <div className="flex items-start space-x-6">
                {formData.icon && (
                  <img src={formData.icon} alt="项目图标" className="w-16 h-16 rounded-lg object-cover" />
                )}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{formData.name || '未填写项目名称'}</h3>
                    {formData.is_vip === 1 && (
                      <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-semibold rounded-full">
                        VIP
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{formData.description || '未填写项目简介'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {formData.website && (
                      <div>
                        <span className="font-medium text-gray-700">官网：</span>
                        <a href={formData.website} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 ml-1">
                          {formData.website}
                        </a>
                      </div>
                    )}
                    {formData.twitter_url && (
                      <div>
                        <span className="font-medium text-gray-700">X：</span>
                        <a href={formData.twitter_url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 ml-1">
                          {formData.twitter_url}
                        </a>
                      </div>
                    )}
                    {formData.linkedin_url && (
                      <div>
                        <span className="font-medium text-gray-700">LinkedIn：</span>
                        <a href={formData.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 ml-1">
                          {formData.linkedin_url}
                        </a>
                      </div>
                    )}
                    {formData.whitepaper_url && (
                      <div>
                        <span className="font-medium text-gray-700">白皮书：</span>
                        <a href={formData.whitepaper_url} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600 ml-1">
                          {formData.whitepaper_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6">
                  {formData.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* Content Preview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">内容预览</h2>
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



