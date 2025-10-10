'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { getInviteCookie } from '@/lib/inviteUtils'
import UnifiedLogin from './UnifiedLogin'
import MobileMenu from './MobileMenu'
import InviteCodeModal from './InviteCodeModal'
import { Menu, User } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

export default function MobileHeader() {
  const [isClient, setIsClient] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthMenu, setShowAuthMenu] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false)
  const { isConnected } = useAccount()
  const { isAuthenticated, user } = useMultiAuth()

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 邀请码验证成功后的回调
  const handleInviteCodeSuccess = useCallback(() => {
    setShowInviteCodeModal(false)
    setShowRegisterModal(true)
  }, [])

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-[45] bg-background-secondary/95 backdrop-blur-md border-b border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo区域 */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative w-8 h-8">
              <Image
                src="/lulala_logo.png"
                alt="Lulala区块链投研平台 Logo"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
                Lulala LABS
              </h1>
            </div>
          </Link>

          {/* 右侧操作区域 */}
          <div className="flex items-center space-x-3">
            <ThemeToggle />
            
            {/* 未登录：显示用户图标，点击显示登录/注册选项 */}
            {isClient && !isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowAuthMenu(!showAuthMenu)}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-card transition-colors"
                >
                  <User className="h-5 w-5" />
                </button>
                
                {/* 登录/注册下拉菜单 */}
                {showAuthMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-[50]" 
                      onClick={() => setShowAuthMenu(false)}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        setShowAuthMenu(false)
                      }}
                    />
                    <div className="absolute right-0 top-full mt-2 w-36 bg-background-card border border-gray-700 rounded-lg shadow-xl overflow-hidden z-[51]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAuthMenu(false)
                          setShowLoginModal(true)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-primary/10 transition-colors"
                      >
                        登录
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowAuthMenu(false)
                          
                          // 检查邀请码
                          const inviteUid = getInviteCookie()
                          if (!inviteUid) {
                            // 没有邀请码，显示邀请码输入弹窗
                            setShowInviteCodeModal(true)
                          } else {
                            // 有邀请码，直接显示注册弹窗
                            setShowRegisterModal(true)
                          }
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-primary/10 transition-colors border-t border-gray-700"
                      >
                        注册
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}
            
            <button
              onClick={() => setIsMenuOpen(true)}
              className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-card transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* 顶部安全区域适配 */}
        <div className="h-safe-area-inset-top bg-background-secondary/95"></div>
      </header>
      
      {/* 移动端菜单 - 移到header外面 */}
      <MobileMenu 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)} 
      />
      
      {/* UnifiedLogin 组件用于处理实际的登录/注册逻辑 */}
      {(showLoginModal || showRegisterModal) && (
        <UnifiedLogin 
          compact={false}
          initialMode={showLoginModal ? 'login' : 'register'}
          onClose={() => {
            setShowLoginModal(false)
            setShowRegisterModal(false)
          }}
        />
      )}
      
      {/* 邀请码输入弹窗 */}
      <InviteCodeModal
        isOpen={showInviteCodeModal}
        onClose={() => {}} // 不允许直接关闭
        onSuccess={handleInviteCodeSuccess}
      />
    </>
  )
}
