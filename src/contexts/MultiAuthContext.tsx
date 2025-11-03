'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { User } from 'firebase/auth'
import { FirebaseAuthService } from '@/lib/firebase'
import { publicAPI } from '@/lib/publicAPI'

// 移除登录方式枚举 - 前端只需要知道用户的数据状态，不需要区分登录方式

interface UserInfo {
  id?: number
  wallet_address?: string
  email?: string
  nickname: string
  avatar: string
  vip_level?: number
  vip_vailddate?: number
  trade_level?: number
  trade_vailddate?: number
  firebase_uid?: string
  usertype?: number
  invite_reward?: number
  can_publish_strategy?: number
}

interface MultiAuthContextType {
  // 认证状态
  isAuthenticated: boolean
  user: UserInfo | null
  loading: boolean
  
  // 钱包登录
  walletLogin: (token: string, expireTime: number) => void
  
  // Google 登录
  googleLogin: () => Promise<void>
  
  // 邮箱登录
  emailLogin: (email: string, password: string) => Promise<void>
  emailSignup: (email: string, password: string, nickname?: string) => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  
  // 通用登出
  logout: () => Promise<void>
  
  // 重新检查认证状态
  refreshAuth: () => Promise<void>
}

const MultiAuthContext = createContext<MultiAuthContextType | undefined>(undefined)

export function useMultiAuth() {
  const context = useContext(MultiAuthContext)
  if (context === undefined) {
    throw new Error('useMultiAuth must be used within a MultiAuthProvider')
  }
  return context
}

interface MultiAuthProviderProps {
  children: ReactNode
}

// 移除管理员认证检查 - 管理后台认证是独立的系统

export function MultiAuthProvider({ children }: MultiAuthProviderProps) {
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // 初始化认证状态
  useEffect(() => {
    setMounted(true)
    initializeAuth()
  }, [])

  // 初始化认证状态
  const initializeAuth = async () => {
    try {
      // 统一使用 profile API 检查用户登录状态（前端用户，不包括管理员）
      console.log('🔍 检查用户登录状态...')
      const response = await publicAPI.get('/v1/users/profile', { operation: 'get' })
      console.log('📊 Profile API 响应:', response)
      
      if (response.api_code == 200 && response.data) {
        console.log('✅ 用户已登录，用户数据:', response.data)
        
        setIsAuthenticated(true)
        setUser(response.data)
        setLoading(false)
        return
      } else {
        console.log('❌ 用户未登录，响应码:', response.api_code, '消息:', response.api_msg)
      }
    } catch (error) {
      console.log('💥 登录状态检查失败:', error)
    }

    // 如果 profile API 检查失败，设置为未登录状态
    console.log('🚫 设置为未登录状态')
    setIsAuthenticated(false)
    setUser(null)
    setLoading(false)
  }



  // 移除路由保护逻辑 - 这应该由管理后台独立处理

  // 钱包登录（登录后重新检查认证状态）
  const walletLogin = async (token: string, expireTime: number) => {
    // 钱包登录后，cookie已经由后端设置，只需要重新初始化认证状态
    await initializeAuth()
  }

  // Google 登录
  const googleLogin = async () => {
    try {
      const firebaseUser = await FirebaseAuthService.signInWithGoogle()
      
      // 获取 Firebase ID Token
      const idToken = await firebaseUser.getIdToken()
      
      // 发送到后端验证并获取用户信息
      const response = await publicAPI.post('/v1/users/firebaseLogin', {
        firebase_uid: firebaseUser.uid,
        id_token: idToken,
        email: firebaseUser.email,
        display_name: firebaseUser.displayName,
        photo_url: firebaseUser.photoURL
      })

      if (response.api_code == 200) {
        // 登录成功后，重新初始化认证状态
        await initializeAuth()
      } else {
        throw new Error(response.api_msg || 'Google 登录失败')
      }
    } catch (error: any) {
      console.error('Google 登录失败:', error)
      throw error
    }
  }

  // 邮箱登录
  const emailLogin = async (email: string, password: string) => {
    try {
      const firebaseUser = await FirebaseAuthService.signInWithEmail(email, password)
      
      // 获取 Firebase ID Token
      const idToken = await firebaseUser.getIdToken()
      
      // 发送到后端验证并获取用户信息
      const response = await publicAPI.post('/v1/users/firebaseLogin', {
        firebase_uid: firebaseUser.uid,
        id_token: idToken,
        email: firebaseUser.email,
        display_name: firebaseUser.displayName,
        photo_url: firebaseUser.photoURL
      })

      if (response.api_code == 200) {
        console.log('✅ 邮箱登录后端成功，刷新认证状态...')
        // 登录成功后，重新初始化认证状态
        await initializeAuth()
        console.log('🔄 邮箱登录认证状态刷新完成')
      } else {
        throw new Error(response.api_msg || '邮箱登录失败')
      }
    } catch (error: any) {
      console.error('邮箱登录失败:', error)
      throw error
    }
  }

  // 邮箱注册
  const emailSignup = async (email: string, password: string, nickname?: string) => {
    try {
      const firebaseUser = await FirebaseAuthService.signUpWithEmail(email, password, nickname)
      
      // 获取 Firebase ID Token
      const idToken = await firebaseUser.getIdToken()
      
      // 发送到后端验证并获取用户信息
      const response = await publicAPI.post('/v1/users/firebaseLogin', {
        firebase_uid: firebaseUser.uid,
        id_token: idToken,
        email: firebaseUser.email,
        display_name: firebaseUser.displayName || nickname,
        photo_url: firebaseUser.photoURL
      })

      if (response.api_code == 200) {
        console.log('✅ 邮箱注册后端成功，刷新认证状态...')
        // 注册成功后，重新初始化认证状态
        await initializeAuth()
        console.log('🔄 邮箱注册认证状态刷新完成')
      } else {
        throw new Error(response.api_msg || '注册失败')
      }
    } catch (error: any) {
      console.error('邮箱注册失败:', error)
      throw error
    }
  }

  // 发送密码重置邮件
  const sendPasswordReset = async (email: string) => {
    try {
      await FirebaseAuthService.sendPasswordReset(email)
    } catch (error: any) {
      console.error('发送密码重置邮件失败:', error)
      throw error
    }
  }

  // 用户登出
  const logout = async () => {
    try {
      // 1. Firebase 登出
      await FirebaseAuthService.signOut()
      
      // 2. 清除后端cookie
      try {
        await fetch('/v1/users/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      } catch (error) {
        console.log('清除后端状态失败:', error)
      }
      
      // 3. 更新前端状态
      setIsAuthenticated(false)
      setUser(null)
      
      // 4. 通知其他页面
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-auth-logout'))
      }
      
    } catch (error) {
      console.error('登出失败:', error)
      throw error
    }
  }

  // 暴露重新检查认证状态的方法
  const refreshAuth = async () => {
    await initializeAuth()
  }

  const value = {
    isAuthenticated,
    user,
    loading,
    walletLogin,
    googleLogin,
    emailLogin,
    emailSignup,
    sendPasswordReset,
    logout,
    refreshAuth
  }

  // 在组件挂载前显示加载状态
  if (!mounted) {
    return (
      <MultiAuthContext.Provider value={value}>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </MultiAuthContext.Provider>
    )
  }

  return (
    <MultiAuthContext.Provider value={value}>
      {children}
    </MultiAuthContext.Provider>
  )
}
