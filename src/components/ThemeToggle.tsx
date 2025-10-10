'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

type Theme = 'dark' | 'light'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 从localStorage读取保存的主题，默认为dark
    const savedTheme = localStorage.getItem('theme') as Theme || 'dark'
    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'light') {
      root.classList.add('light-theme')
      root.classList.remove('dark-theme')
    } else {
      root.classList.add('dark-theme')
      root.classList.remove('light-theme')
    }
  }

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  // 防止水合不匹配
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-card transition-colors">
        <Sun className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-background-card transition-colors"
      title={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  )
}
