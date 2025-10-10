'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import UnifiedLogin from './UnifiedLogin'
import MembershipStatus from './MembershipStatus'
import UserAvatar from './UserAvatar'
import UserProfileModal from './UserProfileModal'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { userProfileAPI } from '@/lib/publicAPI'
import { useGlobalConfig } from '@/lib/useGlobalConfig'
import { useDisconnect } from 'wagmi'
import { 
  Home, 
  FileText, 
  Newspaper, 
  User,
  Settings,
  Github,
  Mail,
  MessageCircle,
  Coins,
  Crown,
  Gift,
  MessageSquare,
  Rocket,
  LogOut,
  Copy,
  Check,
  TrendingUp
} from 'lucide-react'
import { XIcon, TelegramIcon, DiscordIcon } from '@/components/CustomIcons'
import ThemeToggle from '@/components/ThemeToggle'

export default function Sidebar() {
  const [isClient, setIsClient] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [copiedAddress, setCopiedAddress] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated, user, refreshAuth, logout } = useMultiAuth()
  const { config: globalConfig } = useGlobalConfig()
  const { disconnect } = useDisconnect()
  
  // 用户积分
  const [userPoints, setUserPoints] = useState<number>(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 加载用户积分（point）
  const loadUserPoints = async () => {
    if (!isAuthenticated) return
    try {
      const res = await userProfileAPI.getUserProfile()
      if (res.api_code == 200 && res.data) {
        const point = Number((res.data as any).point || 0)
        setUserPoints(isNaN(point) ? 0 : point)
      }
    } catch (e) {
      console.error('加载用户积分失败', e)
    }
  }

  useEffect(() => {
    loadUserPoints()
  }, [isAuthenticated])

  // 监听积分更新事件
  useEffect(() => {
    const handlePointsUpdate = () => {
      loadUserPoints()
    }

    window.addEventListener('user-points-updated', handlePointsUpdate)
    return () => {
      window.removeEventListener('user-points-updated', handlePointsUpdate)
    }
  }, [isAuthenticated])

  // 保存用户资料
  const saveUserProfile = async (profile: { nickname: string; avatar: string }) => {
    try {
      await userProfileAPI.saveUserProfile(profile)
      // 保存成功后，立即刷新用户状态以更新头像和昵称
      await refreshAuth()
      console.log('✅ 用户资料保存成功，状态已刷新')
    } catch (error) {
      console.error('❌ 保存用户资料失败:', error)
      throw error
    }
  }

  // 复制钱包地址
  const copyWalletAddress = async () => {
    if (!user?.wallet_address) return
    
    try {
      await navigator.clipboard.writeText(user.wallet_address)
      setCopiedAddress(true)
      // 2秒后重置状态
      setTimeout(() => {
        setCopiedAddress(false)
      }, 2000)
    } catch (error) {
      console.error('复制失败:', error)
      // 降级方案：使用传统的复制方法
      try {
        const textArea = document.createElement('textarea')
        textArea.value = user.wallet_address
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        setCopiedAddress(true)
        setTimeout(() => {
          setCopiedAddress(false)
        }, 2000)
      } catch (fallbackError) {
        console.error('降级复制也失败:', fallbackError)
      }
    }
  }

  const navigationItems = [
    { href: '/', label: '首页', icon: Home },
    { href: '/airdrops', label: '空投大厅', icon: Gift },
    { href: '/research', label: '投研报告', icon: FileText },
    { href: '/alpha', label: '币安Alpha任务专区', icon: Rocket, isSpecial: true },
    { href: '/rumors', label: '小道消息', icon: MessageSquare },
    { href: '/trading', label: '合约/现货策略', icon: TrendingUp, isTrading: true },
    { href: '/news', label: '行业资讯', icon: Newspaper },
    { href: '/subscription', label: '会员订阅', icon: Crown },
  ]

  const socialLinks = [
    { icon: XIcon, href: globalConfig.twitter || '#', label: 'X (Twitter)' },
    { icon: TelegramIcon, href: globalConfig.telegram || '#', label: 'Telegram' },
    { icon: DiscordIcon, href: globalConfig.discord || '#', label: 'Discord' },
    { icon: Github, href: globalConfig.github || '#', label: 'Github' },
    { icon: Mail, href: globalConfig.email || '#', label: 'Email' },
  ]

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Sidebar - 仅在桌面端显示 */}
      <aside className="hidden md:flex h-screen w-64 xl:w-72 bg-background-secondary border-r border-gray-800 flex-col z-[1000]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative w-8 h-8 group-hover:scale-110 transition-transform duration-200">
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
              <p className="text-xs text-text-muted">区块链投研平台</p>
            </div>
          </Link>
          <ThemeToggle />
        </div>



        {/* Navigation */}
        <nav className="flex-1 p-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive = isActiveRoute(item.href)
              const isSpecial = item.isSpecial
              const isTrading = item.isTrading
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg transition-all group relative text-sm
                    ${isSpecial 
                      ? isActive
                        ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                        : 'bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-300 hover:text-pink-400 hover:bg-gradient-to-r hover:from-pink-500/20 hover:to-purple-500/20 border border-pink-400/20 hover:border-pink-400/30'
                      : isTrading
                        ? isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 border border-cyan-400/30'
                          : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 text-cyan-300 hover:text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-500/20 hover:to-purple-500/20 border border-cyan-400/20 hover:border-cyan-400/30'
                        : isActive 
                          ? 'bg-primary/20 text-primary border border-primary/30' 
                          : 'text-text-secondary hover:text-primary hover:bg-primary/10 border border-transparent hover:border-primary/20'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isSpecial ? (isActive ? 'text-pink-400' : 'text-pink-300 group-hover:text-pink-400') : isTrading ? (isActive ? 'text-cyan-400' : 'text-cyan-300 group-hover:text-cyan-400') : (isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary')}`} />
                  <span className={`font-medium truncate ${isTrading ? 'text-base' : ''}`}>{item.label}</span>
                  {isSpecial && (
                    <div className="ml-auto bg-gradient-to-r from-pink-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                      VIP
                    </div>
                  )}
                  {isTrading && (
                    <div className="ml-auto bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-1.5 py-0.5 rounded-full text-xs font-bold flex-shrink-0">
                      交易
                    </div>
                  )}
                  {isActive && !isSpecial && !isTrading && (
                    <div className="ml-auto w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-gray-800">
          {isClient && isAuthenticated && user ? (
            <div className="flex items-center space-x-2 mb-3">
              <UserAvatar 
                avatar={user.avatar} 
                nickname={user.nickname} 
                size="sm" 
              />
              <div className="flex-1 min-w-0">
                <p className="text-text-primary font-medium text-sm truncate">{user.nickname}</p>
                {user.wallet_address ? (
                  <div className="flex items-center space-x-1">
                    <p className="text-text-muted text-xs font-mono truncate">
                      {`${user.wallet_address.slice(0, 4)}...${user.wallet_address.slice(-4)}`}
                    </p>
                    <button
                      onClick={copyWalletAddress}
                      className="p-0.5 hover:bg-background-card rounded transition-colors flex-shrink-0 group"
                      title={copiedAddress ? "已复制" : "复制钱包地址"}
                    >
                      {copiedAddress ? (
                        <Check className="h-3 w-3 text-green-400" />
                      ) : (
                        <Copy className="h-3 w-3 text-text-muted group-hover:text-primary transition-colors" />
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      // 触发 UnifiedLogin 的绑定钱包弹窗
                      const event = new CustomEvent('show-wallet-binding-modal')
                      window.dispatchEvent(event)
                    }}
                    className="text-xs text-primary hover:text-primary-light transition-colors"
                  >
                    绑定钱包
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => setShowProfileModal(true)}
                  className="p-1.5 hover:bg-background-card rounded-lg transition-colors flex-shrink-0"
                  title="编辑个人资料"
                >
                  <Settings className="h-4 w-4 text-text-muted hover:text-primary" />
                </button>
                <button 
                  onClick={async () => {
                    try {
                      await logout()
                      localStorage.removeItem('wallet_token')
                      localStorage.removeItem('wallet_user')
                      
                      // 清理Firebase登录状态
                      try {
                        const { FirebaseAuthService } = await import('@/lib/firebase')
                        await FirebaseAuthService.signOut()
                      } catch (error) {
                        console.log('Firebase登出失败:', error)
                      }
                      
                      // 清理后端cookie
                      try {
                        await fetch('/v1/users/logout', {
                          method: 'POST',
                          credentials: 'include',
                          headers: {
                            'Content-Type': 'application/json',
                          }
                        })
                      } catch (error) {
                        console.log('清理cookie失败:', error)
                      }
                      
                      disconnect()
                      
                      if (typeof window !== 'undefined') {
                        window.dispatchEvent(new Event('wallet-auth-logout'))
                      }
                    } catch (error) {
                      console.error('断开连接时出错:', error)
                      disconnect()
                    }
                  }}
                  className="p-1.5 hover:bg-background-card rounded-lg transition-colors flex-shrink-0"
                  title="退出登录"
                >
                  <LogOut className="h-4 w-4 text-text-muted hover:text-red-400" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-text-secondary font-medium text-sm truncate">
                  {isClient ? '请先登录' : '加载中...'}
                </p>
                <p className="text-text-muted text-xs truncate">
                  {isClient ? '登录成功后开始使用' : ''}
                </p>
              </div>
            </div>
          )}

          {/* Membership Status */}
          {isClient && isAuthenticated && (
            <div className="mb-2">
              <MembershipStatus />
            </div>
          )}

          {/* User Login */}
          <div className="space-y-1.5">
            <UnifiedLogin />
            {isClient && isAuthenticated && (
              <div className="grid grid-cols-2 gap-1.5">
                <Link
                  href="/profile"
                  className="border border-gray-700 hover:border-pink-400 text-text-secondary hover:text-pink-400 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-xs"
                >
                  <User className="h-3 w-3" />
                  <span>个人中心</span>
                </Link>
                <Link
                  href="/tasks"
                  className="border border-amber-600 hover:border-amber-500 text-amber-400 hover:text-amber-300 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 text-xs bg-amber-900/20 hover:bg-amber-900/30"
                >
                  <Coins className="h-3 w-3" />
                  <span className="truncate">{isClient ? userPoints.toLocaleString() : '---'}</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        <div className="p-3 border-t border-gray-800">
          <p className="text-text-muted text-xs mb-2">关注我们</p>
          <div className="flex space-x-1">
            {socialLinks.map((social, index) => (
              <a
                key={index}
                href={social.href}
                className="p-1.5 rounded-lg bg-background-card hover:bg-primary/20 transition-colors group flex-1 flex items-center justify-center"
                aria-label={social.label}
              >
                <social.icon className="h-3 w-3 text-text-muted group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-800">
          <p className="text-text-muted text-xs text-center">
            © 2025 Lulala LABS
          </p>
        </div>
      </aside>

      {/* 用户资料修改弹窗 */}
      {showProfileModal && (
        <UserProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSave={saveUserProfile}
          initialProfile={{
            nickname: user?.nickname || '',
            avatar: user?.avatar || ''
          }}
        />
      )}
    </>
  )
}
