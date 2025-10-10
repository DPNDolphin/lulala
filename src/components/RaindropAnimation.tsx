'use client'

import { useEffect, useRef, useState } from 'react'

interface RaindropAnimationProps {
  intensity?: 'light' | 'medium' | 'heavy'
  color?: string
  speed?: number
  className?: string
  enableSplashes?: boolean
}

interface Raindrop {
  x: number
  y: number
  length: number
  speed: number
  opacity: number
  width: number
}

interface Splash {
  x: number
  y: number
  radius: number
  opacity: number
  maxRadius: number
  speed: number
}

export default function RaindropAnimation({ 
  intensity = 'medium', 
  color = '#3b82f6',
  speed = 1,
  className = '',
  enableSplashes = true
}: RaindropAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const raindropsRef = useRef<Raindrop[]>([])
  const splashesRef = useRef<Splash[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !isVisible) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布大小
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // 根据强度设置雨滴数量
    const getRaindropCount = () => {
      switch (intensity) {
        case 'light': return 30
        case 'medium': return 60
        case 'heavy': return 120
        default: return 60
      }
    }

    // 初始化雨滴
    const initRaindrops = () => {
      raindropsRef.current = []
      const count = getRaindropCount()
      
      for (let i = 0; i < count; i++) {
        raindropsRef.current.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          length: Math.random() * 25 + 15,
          speed: (Math.random() * 2 + 1) * speed,
          opacity: Math.random() * 0.4 + 0.2,
          width: Math.random() * 0.5 + 0.5
        })
      }
    }

    // 创建水花效果
    const createSplash = (x: number, y: number) => {
      if (!enableSplashes) return
      
      for (let i = 0; i < 3; i++) {
        splashesRef.current.push({
          x: x + (Math.random() - 0.5) * 10,
          y: y,
          radius: 0,
          opacity: 0.6,
          maxRadius: Math.random() * 8 + 4,
          speed: Math.random() * 0.3 + 0.2
        })
      }
    }

    initRaindrops()

    // 动画循环
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      
      // 更新和绘制雨滴
      raindropsRef.current.forEach((raindrop) => {
        // 更新雨滴位置
        raindrop.y += raindrop.speed
        
        // 如果雨滴超出屏幕底部，创建水花并重新从顶部开始
        if (raindrop.y > window.innerHeight) {
          createSplash(raindrop.x, window.innerHeight)
          raindrop.y = -raindrop.length
          raindrop.x = Math.random() * window.innerWidth
          raindrop.length = Math.random() * 25 + 15
          raindrop.speed = (Math.random() * 2 + 1) * speed
          raindrop.opacity = Math.random() * 0.4 + 0.2
        }

        // 绘制雨滴
        ctx.strokeStyle = color
        ctx.globalAlpha = raindrop.opacity
        ctx.lineWidth = raindrop.width
        ctx.lineCap = 'round'
        
        ctx.beginPath()
        ctx.moveTo(raindrop.x, raindrop.y)
        ctx.lineTo(raindrop.x, raindrop.y + raindrop.length)
        ctx.stroke()
      })

      // 更新和绘制水花
      if (enableSplashes) {
        splashesRef.current = splashesRef.current.filter((splash) => {
          splash.radius += splash.speed
          splash.opacity -= 0.02
          
          if (splash.radius < splash.maxRadius && splash.opacity > 0) {
            ctx.strokeStyle = color
            ctx.globalAlpha = splash.opacity
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.arc(splash.x, splash.y, splash.radius, 0, Math.PI * 2)
            ctx.stroke()
            return true
          }
          return false
        })
      }

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [intensity, color, speed, enableSplashes, isVisible])

  // 页面可见性检测，优化性能
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ 
        background: 'transparent',
        mixBlendMode: 'normal'
      }}
    />
  )
}
