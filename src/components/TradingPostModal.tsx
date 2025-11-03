'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'

// 动态导入Markdown编辑器，避免SSR问题
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })
const MDEditorMarkdown = dynamic(() => import('@uiw/react-md-editor').then(mod => ({ default: mod.default.Markdown })), { ssr: false })

export default function TradingPostModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess: () => void }) {
  const [type, setType] = useState<'现货' | '合约'>('现货')
  const [symbol, setSymbol] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [validMinutes, setValidMinutes] = useState<number | ''>('')
  // 移除状态选择，直接发布为 active
  const [loading, setLoading] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!open) return null

  // 处理内容变化
  const handleContentChange = (value?: string) => {
    setContent(value || '')
  }

  // 在光标位置插入图片
  const insertImageAtCursor = (imageUrl: string, altText: string = '图片') => {
    const imageMarkdown = `![${altText}](${imageUrl})`
    let textarea: HTMLTextAreaElement | null = null
    let start = 0
    let end = 0
    
    // 尝试找到编辑器中的 textarea
    textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement
    if (!textarea) textarea = document.querySelector('.w-md-editor .w-md-editor-text-input') as HTMLTextAreaElement
    if (!textarea) textarea = document.querySelector('.w-md-editor textarea') as HTMLTextAreaElement
    if (!textarea) {
      textarea = document.activeElement as HTMLTextAreaElement
      if (!textarea || textarea.tagName !== 'TEXTAREA') textarea = null
    }
    
    const currentContent = content
    if (textarea && textarea.selectionStart !== undefined && textarea.selectionEnd !== undefined) {
      start = textarea.selectionStart
      end = textarea.selectionEnd
      const beforeCursor = currentContent.substring(0, start)
      const afterCursor = currentContent.substring(end)
      const needsNewlineBefore = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
      const needsNewlineAfter = afterCursor.length > 0 && !afterCursor.startsWith('\n')
      const newContent = beforeCursor + (needsNewlineBefore ? '\n' : '') + imageMarkdown + (needsNewlineAfter ? '\n' : '') + afterCursor
      setContent(newContent)
      setTimeout(() => {
        const newCursorPos = start + (needsNewlineBefore ? 1 : 0) + imageMarkdown.length + (needsNewlineAfter ? 1 : 0)
        if (textarea) {
          textarea.setSelectionRange(newCursorPos, newCursorPos)
          textarea.focus()
        }
      }, 100)
    } else {
      const newContent = currentContent + '\n' + imageMarkdown
      setContent(newContent)
    }
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

  const submit = async () => {
    if (!symbol || !title || !content) {
      setError('请填写必填项')
      return
    }
    try {
      setLoading(true)
      setError('')
      const form = new FormData()
      form.set('type', type)
      form.set('symbol', symbol)
      form.set('title', title)
      form.set('content', content)
      form.set('status', 'active') // 直接发布为 active 状态
      const minutes = typeof validMinutes === 'number' ? validMinutes : 0
      form.set('valid_minutes', String(minutes || 0))

      const res = await fetch('/v1/trading/create', { method: 'POST', body: form })
      const data = await res.json()
      if (data.api_code === 200) {
        onSuccess()
        onClose()
      } else {
        setError(data.api_msg || '发布失败')
      }
    } catch (e) {
      console.error(e)
      setError('发布失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center">
      <div className="fixed inset-0 z-[10040] bg-black/80" onClick={onClose} />
      <div className="relative z-[10060] w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary">发布交易策略</h3>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setPreviewMode(!previewMode)}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              {previewMode ? '编辑' : '预览'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
        
        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="flex gap-3">
            <button onClick={() => setType('现货')} className={`px-3 py-2 rounded border ${type==='现货'?'border-cyan-400 text-cyan-400':'border-gray-700 text-gray-300'}`}>现货</button>
            <button onClick={() => setType('合约')} className={`px-3 py-2 rounded border ${type==='合约'?'border-cyan-400 text-cyan-400':'border-gray-700 text-gray-300'}`}>合约</button>
          </div>
          <input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="币种/交易对（如 BTC/USDT）" className="w-full px-3 py-2 rounded bg-background-card border border-gray-800" />
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="标题" className="w-full px-3 py-2 rounded bg-background-card border border-gray-800" />
          
          {/* Markdown 编辑器 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              内容 * (Markdown格式)
            </label>
            {!previewMode ? (
              <div data-color-mode="dark">
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
                    id="trading-editor-image-upload"
                  />
                  <label
                    htmlFor="trading-editor-image-upload"
                    className="inline-flex items-center px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded cursor-pointer transition-colors"
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
                  value={content}
                  onChange={handleContentChange}
                  height={400}
                  preview="edit"
                  data-color-mode="dark"
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
            ) : (
              /* 预览模式 */
              <div className="bg-gray-800 rounded border border-gray-700 p-4 min-h-[400px]">
                <MDEditorMarkdown source={content} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="有效期（分钟）"
              value={validMinutes}
              onChange={(e) => setValidMinutes(e.target.value ? Number(e.target.value) : '')}
              className="px-3 py-2 rounded bg-background-card border border-gray-800 w-40"
              min="1"
            />
            <span className="text-sm text-gray-400">不填视为长期有效</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 rounded border border-gray-700 text-gray-300">取消</button>
            <button disabled={loading} onClick={submit} className="px-5 py-2 rounded bg-cyan-600 text-white disabled:opacity-50">{loading ? '提交中...' : '提交发布'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}


