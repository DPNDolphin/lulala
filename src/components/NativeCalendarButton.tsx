'use client'

import { Calendar } from 'lucide-react'

interface NativeCalendarButtonProps {
  airdropId: string | number
  className?: string
}

export default function NativeCalendarButton({ airdropId, className = '' }: NativeCalendarButtonProps) {
  // 检测是否为微信浏览器
  const isWeChatBrowser = (): boolean => {
    if (typeof window === 'undefined') return false
    const ua = navigator.userAgent.toLowerCase()
    return /micromessenger/i.test(ua)
  }

  // 检测是否为桌面端
  const isDesktop = (): boolean => {
    if (typeof window === 'undefined') return false
    // 检测是否为移动设备
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    // 检测屏幕宽度（移动设备通常小于 768px）
    const isSmallScreen = window.innerWidth < 768
    return !isMobile && !isSmallScreen
  }

  // 添加到日历
  const handleAddToCalendar = () => {
    // 如果是微信浏览器，显示提示
    if (isWeChatBrowser()) {
      alert('请在系统默认浏览器中打开本页面后再添加到日历')
      return
    }

    const icsUrl = `https://www.lulala.ai/v1/research/ics?id=${airdropId}`
    
    if (isDesktop()) {
      // 桌面端：使用 webcal:// 协议订阅日历
      const webcalUrl = icsUrl.replace(/^https?:\/\//, 'webcal://')
      window.location.href = webcalUrl
    } else {
      // 移动端：下载 .ics 文件
      const link = document.createElement('a')
      link.href = icsUrl
      link.download = `airdrop-${airdropId}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <button
      onClick={handleAddToCalendar}
      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 hover:text-purple-200 transition-colors text-xs font-medium border border-purple-500/30 ${className}`}
      title="添加提醒"
    >
      <Calendar className="h-3.5 w-3.5" />
      <span>添加提醒</span>
    </button>
  )
}

