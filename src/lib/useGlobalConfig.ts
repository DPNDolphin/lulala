import { useState, useEffect } from 'react'

interface GlobalConfig {
  twitter?: string
  telegram?: string
  discord?: string
  github?: string
  email?: string
  [key: string]: any
}

export function useGlobalConfig() {
  const [config, setConfig] = useState<GlobalConfig>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/v1/global/config')
        const data = await response.json()
        
        if (data.api_code == 200) {
          setConfig(data)
        } else {
          setError(data.api_msg || '获取配置失败')
        }
      } catch (err) {
        console.error('获取全局配置失败:', err)
        setError('网络错误')
        // 设置默认配置
        setConfig({
          twitter: '#',
          telegram: '#',
          discord: '#',
          github: '#',
          email: '#'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [])

  return { config, loading, error }
}
