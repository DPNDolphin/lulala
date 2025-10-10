'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Gift, Loader2, Check } from 'lucide-react'
import { publicAPI } from '@/lib/publicAPI'
import { setInviteCookie } from '@/lib/inviteUtils'

interface InviteCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InviteCodeModal({ isOpen, onClose, onSuccess }: InviteCodeModalProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  // 清除消息
  const clearMessage = () => setMessage(null)

  // 显示消息
  const showMessage = (type: 'error' | 'success', text: string) => {
    setMessage({ type, text })
    setTimeout(clearMessage, 5000)
  }

  // 验证邀请码
  const handleVerifyInviteCode = async () => {
    if (!inviteCode.trim()) {
      showMessage('error', '请输入邀请码')
      return
    }

    setIsVerifying(true)
    clearMessage()

    try {
      const response = await publicAPI.post('/v1/users/verifyInviteCode', {
        invite_code: inviteCode.trim()
      })

      if (response.api_code === 200) {
        // 设置邀请cookie
        setInviteCookie(response.data.inviter.usernumber)
        
        showMessage('success', `邀请码验证成功！邀请者：${response.data.inviter.nickname}`)
        
        // 延迟关闭弹窗并触发成功回调
        setTimeout(() => {
          onSuccess()
          onClose()
        }, 1500)
      } else {
        throw new Error(response.api_msg || '邀请码验证失败')
      }
    } catch (error: any) {
      console.error('邀请码验证失败:', error)
      showMessage('error', error.message || '邀请码验证失败，请检查邀请码是否正确')
    } finally {
      setIsVerifying(false)
    }
  }


  // 处理回车键
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isVerifying) {
      handleVerifyInviteCode()
    }
  }

  if (!isOpen || !mounted) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center p-4 min-h-screen">
      <div className="bg-background-card border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden my-auto sm:my-0">
        {/* 弹窗头部 */}
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">
              输入邀请码
            </h3>
          </div>
        </div>

        <div className="p-6">
          {/* 消息显示 */}
          {message && (
            <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
              message.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message.type === 'success' && <Check className="w-4 h-4" />}
              <span className="text-sm">{message.text}</span>
            </div>
          )}

          {/* 说明文字 */}
          <div className="mb-6">
            <p className="text-sm text-text-muted mb-2">
              请输入邀请码以继续
            </p>
          </div>

          {/* 输入框 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-text-primary mb-2">
              邀请码
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="请输入邀请码"
              disabled={isVerifying}
              className="w-full px-4 py-3 bg-background-secondary border border-gray-600 rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* 按钮组 */}
          <div className="flex justify-center">
            <button
              onClick={handleVerifyInviteCode}
              disabled={isVerifying || !inviteCode.trim()}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg font-medium transition-colors hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>验证中...</span>
                </>
              ) : (
                <span>验证邀请码</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
