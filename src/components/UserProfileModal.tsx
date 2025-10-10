'use client'

import { useState, useEffect } from 'react'
import { X, User, Camera, Save, Shuffle, Upload } from 'lucide-react'
import { generateRandomDiceBearAvatar } from '../lib/preset-avatars'

interface UserProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (profile: { nickname: string; avatar: string }) => void
  initialProfile?: { nickname: string; avatar: string }
}

export default function UserProfileModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialProfile = { nickname: '', avatar: '' } 
}: UserProfileModalProps) {
  const [nickname, setNickname] = useState(initialProfile.nickname)
  const [avatar, setAvatar] = useState(initialProfile.avatar)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setNickname(initialProfile.nickname)
      setAvatar(initialProfile.avatar)
    }
  }, [isOpen, initialProfile])

  const handleSave = async () => {
    if (!nickname.trim()) {
      alert('请输入昵称')
      return
    }

    setIsLoading(true)
    try {
      await onSave({ nickname: nickname.trim(), avatar })
      onClose()
    } catch (error) {
      console.error('保存用户信息失败:', error)
      alert('保存失败，请重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('头像文件大小不能超过2MB')
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatar(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRandomAvatar = () => {
    const randomAvatar = generateRandomDiceBearAvatar()
    setAvatar(randomAvatar)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[1100] p-4">
      <div className="bg-background-card rounded-xl max-w-md w-full border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-text-primary">完善个人信息</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="用户头像"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center cursor-pointer hover:bg-pink-500 transition-colors">
                <Upload className="h-3 w-3 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Avatar Selection Options */}
            <div className="flex gap-2">
              <button
                onClick={handleRandomAvatar}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm"
              >
                <Shuffle className="h-4 w-4" />
                <span>随机头像</span>
              </button>
              <label className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 text-sm cursor-pointer">
                <Camera className="h-4 w-4" />
                <span>上传头像</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>

            <p className="text-sm text-text-muted text-center">
              点击随机头像生成 DiceBear 头像，或上传自定义头像
            </p>
          </div>

          {/* Nickname Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-primary">
              昵称 *
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的昵称"
              className="w-full px-4 py-3 bg-background border border-gray-700 rounded-lg focus:border-pink-400 focus:outline-none text-text-primary"
              maxLength={20}
            />
            <p className="text-xs text-text-muted">
              {nickname.length}/20 字符
            </p>
          </div>

          {/* Tips */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-400">
              💡 您可以选择系统预设的头像，也可以上传自定义头像。完善个人信息后，您的评论将显示自定义头像和昵称。
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-700 text-text-secondary hover:text-text-primary hover:border-gray-600 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!nickname.trim() || isLoading}
            className="flex-1 px-4 py-3 bg-pink-400 hover:bg-pink-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>保存中...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>保存</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
