import { useEffect, useState } from 'react'
import { Eye, Clock } from 'lucide-react'

interface NewsCardProps {
  news: {
    id: number
    title: string
    excerpt: string
    category: string
    image?: string
    video_url?: string
    readTime: string
    views: number
    publishedAt: string
    timestamp?: number
  }
}

export default function NewsCard({ news }: NewsCardProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  return (
    <article className="bg-background-card rounded-xl overflow-hidden hover-glow hover:scale-105 transition-all group">
      <div className="h-48 relative overflow-hidden">
        {news.video_url ? (
          // 如果有视频，显示视频预览
          <div className="w-full h-full">
            <iframe
              src={news.video_url}
              className="w-full h-full object-cover"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={news.title}
            ></iframe>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
          </div>
        ) : news.image ? (
          // 如果没有视频但有图片，显示图片
          <>
            <img 
              src={news.image} 
              alt={news.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                // 图片加载失败时显示默认背景
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                const parent = target.parentElement
                if (parent) {
                  parent.style.background = 'linear-gradient(to bottom right, rgba(var(--primary-rgb), 0.2), rgba(var(--primary-rgb), 0.05))'
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </>
        ) : (
          // 既没有视频也没有图片，显示默认背景
          <>
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </>
        )}
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-primary/90 text-white px-3 py-1 rounded-full text-sm font-medium">
            {news.category}
          </span>
        </div>
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-3 text-text-primary line-clamp-2 group-hover:text-primary transition-colors">
          {news.title}
        </h3>
        <p className="text-text-muted mb-4 line-clamp-3 leading-relaxed">
          {news.excerpt}
        </p>
        
        <div className="flex items-center justify-between text-sm text-text-muted">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{news.views}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{news.readTime}</span>
            </div>
          </div>
          <time className="text-text-muted">
            {isClient ? new Date(news.publishedAt).toLocaleDateString('zh-CN') : news.publishedAt}
          </time>
        </div>
      </div>
    </article>
  )
}
