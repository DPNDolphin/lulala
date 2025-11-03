'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import WalletProvider from '@/components/WalletProvider'
import MobileHeader from '@/components/MobileHeader'
import { AuthProvider } from '@/contexts/AdminAuthContext'
import { MultiAuthProvider } from '@/contexts/MultiAuthContext'
import { handleInviteFromUrl } from '@/lib/inviteUtils'

interface ClientLayoutProps {
  children: React.ReactNode
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')
  const isReferralPage = pathname === '/r'
  const isAlphaPage = pathname === '/a'

  // 邀请功能：检查URL参数并设置cookie
  useEffect(() => {
    // 只在客户端执行，且仅在非管理页面处理邀请
    if (typeof window === 'undefined' || isAdminPage) return

    // 处理邀请参数
    handleInviteFromUrl()
  }, [isAdminPage]) // 依赖isAdminPage，确保管理页面不处理邀请

  // 管理页面使用独立布局，支持多重认证，但不包含钱包功能
  if (isAdminPage) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    )
  }

  // 推荐链接与Alpha页面使用全屏布局，不显示侧边栏
  if (isReferralPage || isAlphaPage) {
    return (
      <MultiAuthProvider>
        <WalletProvider>
          <div className="min-h-screen">
            {children}
          </div>
        </WalletProvider>
      </MultiAuthProvider>
    )
  }

  // 前端页面使用原有布局，但添加多重认证支持
  return (
    <MultiAuthProvider>
      <WalletProvider>
        {/* 桌面端布局 */}
        <div className="hidden lg:flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="gradient-bg min-h-full">
              {children}
            </div>
          </main>
        </div>

        {/* 移动端布局 */}
        <div className="lg:hidden min-h-screen">
          {/* 移动端顶部导航 */}
          <MobileHeader />
          
          {/* 主内容区域 */}
          <main className="pt-16 overflow-auto">
            <div className="gradient-bg min-h-full">
              {children}
            </div>
          </main>
        </div>
      </WalletProvider>
    </MultiAuthProvider>
  )
}