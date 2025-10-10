'use client'

import { useState, useRef } from 'react'
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react'
import { adminAPI } from '@/lib/adminAPI'

interface ImageUploaderProps {
  onUpload: (imageUrl: string) => void
  currentImage?: string
  className?: string
}

export default function ImageUploader({ onUpload, currentImage, className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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
        setPreviewUrl(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // 上传文件
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/v1/upload/reportIcon', {
        method: 'POST',
        headers: {
          'Authorization': localStorage.getItem('admin_token') || ''
        },
        body: formData
      })

      const data = await response.json()

      if (data.api_code == 200) {
        onUpload(data.data.url)
        setError('')
      } else {
        setError(data.api_msg || '上传失败')
        setPreviewUrl(currentImage || null)
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      setPreviewUrl(currentImage || null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreviewUrl(null)
    onUpload('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Upload Area */}
        <div
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${uploading ? 'border-gray-300 bg-gray-50' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'}
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
                alt="预览"
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
                  <span className="text-gray-600">上传中...</span>
                </div>
              ) : (
                <>
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="text-pink-600 font-medium">点击上传图片</span> 或拖拽到此处
                    </p>
                    <p className="text-xs text-gray-500">
                      支持 JPG, PNG, GIF, WebP 格式，最大 2MB
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Upload Tips */}
        {!previewUrl && !error && (
          <div className="text-xs text-gray-500">
            <p>建议尺寸：300x300px，文件大小不超过2MB</p>
            <p>支持的格式：JPG、PNG、GIF、WebP</p>
          </div>
        )}
      </div>
    </div>
  )
}