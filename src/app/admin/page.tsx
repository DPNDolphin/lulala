'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminIndexRedirect() {
  const router = useRouter()

  useEffect(() => {
    // 获取管理员模块列表，跳转到第一个有权限的模块
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

    redirectToFirstModule()
  }, [router])

  return null
}


