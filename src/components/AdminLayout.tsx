'use client'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { 
  Users, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  Newspaper,
  MessageSquare,
  Gift,
  Wallet,
  Shield,
  BarChart3,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface AdminLayoutProps {
  children: React.ReactNode
}

interface AdminModule {
  id: number
  module_key: string
  module_name: string
  module_icon: string
  href: string
  sort_order: number
}

interface AdminInfo {
  id: number
  username: string
  real_name: string
  is_super_admin: number
}

// 图标映射
const iconMap: { [key: string]: any } = {
  Users,
  FileText,
  Newspaper,
  Gift,
  Wallet,
  MessageSquare,
  Settings,
  Shield,
  BarChart3,
  Zap
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { logout, loading, isAuthenticated } = useAdminAuth()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [modules, setModules] = useState<AdminModule[]>([])
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [modulesLoading, setModulesLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 获取管理员模块列表
  useEffect(() => {
    if (isAuthenticated && mounted) {
      fetchAdminModules()
    }
  }, [isAuthenticated, mounted])

  const fetchAdminModules = async () => {
    try {
      setModulesLoading(true)
      const response = await fetch('/v1/admin/getModules', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200) {
          setModules(result.data.modules)
          setAdminInfo(result.data.admin_info)
        }
      }
    } catch (error) {
      console.error('获取模块列表失败:', error)
    } finally {
      setModulesLoading(false)
    }
  }

  // 在组件挂载前显示加载状态
  if (!mounted || loading || modulesLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  // 如果未认证，不显示内容（让AuthContext处理跳转）
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">请先登录...</div>
      </div>
    )
  }

  return (
    <div className="admin-layout flex h-screen bg-gray-100 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 bg-gray-800">
          <h1 className="text-white text-lg font-semibold">管理后台</h1>
          <button
            onClick={() => setSidebarOpen(false)}
            className="text-gray-400 hover:text-white lg:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {modules.map((module) => {
              // 精确匹配：如果 href 包含查询参数，完整匹配；否则只匹配路径
              const hasQuery = module.href.includes('?')
              const isActive = hasQuery 
                ? pathname + (mounted ? window.location.search : '') === module.href
                : pathname === module.href
              const IconComponent = iconMap[module.module_icon] || Settings
              return (
                <li key={module.href}>
                  <Link
                    href={module.href}
                    className={`
                      flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-pink-600 text-white' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }
                    `}
                  >
                    <IconComponent className="h-5 w-5 mr-3" />
                    {module.module_name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5 mr-3" />
            退出登录
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center px-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-gray-600 hover:text-gray-900 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-xl font-semibold text-gray-900">
              {modules.find(module => module.href === pathname)?.module_name || '管理后台'}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}