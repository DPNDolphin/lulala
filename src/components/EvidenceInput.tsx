'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Link, Loader, ExternalLink } from 'lucide-react'

interface EvidenceInputProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export default function EvidenceInput({ value, onChange, className = '' }: EvidenceInputProps) {
  const [inputType, setInputType] = useState<'link' | 'image'>('link')
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 检查当前值是否为图片URL
  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url) || url.includes('data:image/')
  }

  // 初始化时检查当前值的类型
  useState(() => {
    if (value) {
      if (isImageUrl(value)) {
        setInputType('image')
        setPreviewUrl(value)
      } else {
        setInputType('link')
      }
    }
  })

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('只支持 JPG, PNG, GIF, WebP 格式的图片')
      return
    }

    // 验证文件大小 (2MB)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('图片文件大小不能超过 2MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // 创建预览
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setPreviewUrl(dataUrl)
        onChange(dataUrl) // 直接使用base64数据URL
      }
      reader.readAsDataURL(file)
    } catch (err) {
      setError('文件读取失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const switchToLink = () => {
    setInputType('link')
    setPreviewUrl(null)
    onChange('')
    setError('')
  }

  const switchToImage = () => {
    setInputType('image')
    setError('')
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* 类型选择器 */}
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={switchToLink}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === 'link'
                ? 'bg-pink-100 text-pink-700 border border-pink-300'
                : 'bg-background-secondary text-text-secondary border border-gray-600 hover:border-gray-500'
            }`}
          >
            <Link className="h-4 w-4" />
            <span>链接</span>
          </button>
          <button
            type="button"
            onClick={switchToImage}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputType === 'image'
                ? 'bg-pink-100 text-pink-700 border border-pink-300'
                : 'bg-background-secondary text-text-secondary border border-gray-600 hover:border-gray-500'
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>图片</span>
          </button>
        </div>

        {/* 链接输入 */}
        {inputType === 'link' && (
          <div>
            <input
              type="url"
              value={value}
              onChange={handleLinkChange}
              placeholder="输入证据链接 (如: https://example.com/evidence)"
              className="w-full bg-background-secondary border border-gray-600 rounded-lg p-3 text-text-primary placeholder-text-muted focus:border-pink-400 focus:outline-none"
            />
            {value && (
              <div className="mt-2 flex items-center space-x-2 text-sm text-text-muted">
                <ExternalLink className="h-4 w-4" />
                <span>将作为链接显示</span>
              </div>
            )}
          </div>
        )}

        {/* 图片上传 */}
        {inputType === 'image' && (
          <div>
            <div
              onClick={handleClick}
              className={`
                relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${uploading ? 'border-gray-300 bg-gray-50' : 'border-gray-600 hover:border-pink-400 hover:bg-pink-50/10'}
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />

              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="证据预览"
                    className="mx-auto max-h-32 rounded-lg object-contain"
                  />
                  {!uploading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove()
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <Loader className="h-6 w-6 text-white animate-spin" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {uploading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Loader className="h-6 w-6 text-gray-400 animate-spin" />
                      <span className="text-text-secondary">上传中...</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-text-muted" />
                      <div className="space-y-1">
                        <p className="text-sm text-text-secondary">
                          <span className="text-pink-400 font-medium">点击上传图片</span>
                        </p>
                        <p className="text-xs text-text-muted">
                          支持 JPG, PNG, GIF, WebP 格式，最大 2MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded border border-red-800">
            {error}
          </div>
        )}

        {/* 提示信息 */}
        {!value && !error && (
          <div className="text-xs text-text-muted">
            <p>• 链接：提供相关证据的网页链接</p>
            <p>• 图片：上传截图或其他图片证据</p>
          </div>
        )}
      </div>
    </div>
  )
}
