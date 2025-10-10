'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'

interface AuthContextType {
  isAuthenticated: boolean
  login: (token: string, expireTime: number) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAdminAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

// 检查是否已登录的辅助函数
function checkIsAuthenticated(): boolean {
  if (typeof window === 'undefined') return false
  
  const token = localStorage.getItem('admin_token')
  const expireTime = localStorage.getItem('admin_token_expire')
  
  if (!token || !expireTime) return false
  
  const currentTime = Math.floor(Date.now() / 1000)
  const tokenExpireTime = parseInt(expireTime)
  
  if (currentTime >= tokenExpireTime) {
    // Token已过期，清除
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_token_expire')
    return false
  }
  
  return true
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 直接使用函数检查登录状态
  const isAuthenticated = checkIsAuthenticated()

  // 跳转到第一个有权限的模块
  const redirectToFirstModule = async () => {
    try {
      const response = await fetch('/v1/admin/getModules', {
        method: 'GET',
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200 && result.data.modules && result.data.modules.length > 0) {
          // 跳转到第一个模块
          router.replace(result.data.modules[0].href)
        } else {
          // 如果没有模块权限，跳转到默认页面
          router.replace('/admin/users')
        }
      } else {
        // 如果获取模块失败，跳转到默认页面
        router.replace('/admin/users')
      }
    } catch (error) {
      console.error('获取模块列表失败:', error)
      // 如果出错，跳转到默认页面
      router.replace('/admin/users')
    }
  }

  // 确保组件挂载后再执行客户端逻辑
  useEffect(() => {
    setMounted(true)
    setLoading(false)
  }, [])

  // 路由保护逻辑
  useEffect(() => {
    if (!mounted || loading) return

    // 如果在管理页面但未登录，跳转到登录页
    if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !isAuthenticated) {
      console.log('Redirecting to login: not authenticated')
      router.replace('/admin/login')
    }
    
    // 如果已登录且在登录页面，跳转到第一个有权限的模块
    if (isAuthenticated && pathname === '/admin/login') {
      console.log('Redirecting to first module: authenticated')
      redirectToFirstModule()
    }
  }, [mounted, loading, pathname, isAuthenticated, router])

  const login = async (token: string, expireTime: number) => {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_token_expire', expireTime.toString())
    
    // 登录成功后跳转到第一个有权限的模块
    await redirectToFirstModule()
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_token_expire')
    router.push('/admin/login')
  }

  const value = {
    isAuthenticated,
    login,
    logout,
    loading
  }

  // 在组件挂载前显示加载状态
  if (!mounted) {
    return (
      <AuthContext.Provider value={value}>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}