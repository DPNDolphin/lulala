'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, User, Eye, Clock, Tag, Share2, Heart } from 'lucide-react'
import { publicAPI } from '@/lib/publicAPI'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface NewsArticle {
  id: number
  title: string
  excerpt: string
  content: string
  category: string
  image: string
  video_url?: string
  author: string
  read_time: number
  views: number
  featured: number
  status: string
  published_at: string
  created_at: string
  updated_at: string
}


export default function NewsDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([])
  
  const [submitting, setSubmitting] = useState(false)

  // 获取新闻详情
  const fetchArticleDetail = async () => {
    try {
      setLoading(true)
      setError('')
      
      const data = await publicAPI.get('/v1/news/public?operation=detail', { 
        id: params.id 
      })
      
      if (data.api_code == 200) {
        setArticle(data.data)
        
        // 获取相关文章
        await fetchRelatedArticles(data.data.category)
      } else {
        setError(data.api_msg || '获取新闻详情失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }



  // 获取相关文章
  const fetchRelatedArticles = async (category: string) => {
    try {
      const data = await publicAPI.get('/v1/news/public?operation=list', {
        category: category,
        limit: 4,
        exclude_id: params.id
      })
      
      if (data.api_code == 200) {
        setRelatedArticles(data.data.articles || [])
      }
    } catch (err) {
      console.error('获取相关文章失败:', err)
    }
  }

  useEffect(() => {
    if (params.id) {
      fetchArticleDetail()
    }
  }, [params.id])

  // 分享功能
  const handleShare = async () => {
    if (navigator.share && article) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt,
          url: window.location.href,
        })
      } catch (err) {
        // 如果分享失败，复制链接到剪贴板
        navigator.clipboard.writeText(window.location.href)
        alert('链接已复制到剪贴板')
      }
    } else {
      // 复制链接到剪贴板
      navigator.clipboard.writeText(window.location.href)
      alert('链接已复制到剪贴板')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
          <p className="text-text-secondary">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-secondary text-lg mb-4">文章不存在</div>
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-text-secondary hover:text-pink-400 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回</span>
        </button>

        {/* 文章头部 */}
        <header className="mb-8">
          {/* 分类标签 */}
          <div className="mb-4">
            <span className="inline-flex items-center space-x-1 bg-pink-400/10 text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
              <Tag className="h-3 w-3" />
              <span>{article.category}</span>
            </span>
          </div>

          {/* 标题 */}
          <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-6 leading-tight">
            {article.title}
          </h1>

          {/* 文章信息 */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-text-muted mb-6">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <span>{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>{article.read_time} 分钟阅读</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>{article.views.toLocaleString()} 阅读</span>
            </div>
          </div>

          {/* 摘要 */}
          {article.excerpt && (
            <div className="bg-background-card border border-gray-700 rounded-lg p-6 mb-8">
              <p className="text-text-secondary text-lg leading-relaxed">{article.excerpt}</p>
            </div>
          )}
        </header>

        {/* 文章视频 */}
        {article.video_url && (
          <div className="mb-8">
            <div className="aspect-video">
              <iframe
                src={article.video_url}
                className="w-full h-full rounded-lg border border-gray-700"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={`${article.title} - 视频`}
              ></iframe>
            </div>
          </div>
        )}

        {/* 文章图片 */}
        {!article.video_url && article.image && (
          <div className="mb-8">
            <img
              src={article.image}
              alt={article.title}
              className="w-full h-auto object-contain rounded-lg"
            />
          </div>
        )}

        {/* 文章内容 */}
        <article className="prose prose-invert max-w-none mb-12 text-text-primary leading-relaxed">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({children}) => <h1 className="text-3xl font-bold text-text-primary mb-4 mt-8 first:mt-0">{children}</h1>,
              h2: ({children}) => <h2 className="text-2xl font-bold text-text-primary mb-3 mt-6">{children}</h2>,
              h3: ({children}) => <h3 className="text-xl font-bold text-text-primary mb-2 mt-4">{children}</h3>,
              h4: ({children}) => <h4 className="text-lg font-bold text-text-primary mb-2 mt-3">{children}</h4>,
              p: ({children}) => <p className="text-text-primary mb-4 leading-relaxed">{children}</p>,
              ul: ({children}) => <ul className="list-disc list-inside text-text-primary mb-4 space-y-1">{children}</ul>,
              ol: ({children}) => <ol className="list-decimal list-inside text-text-primary mb-4 space-y-1">{children}</ol>,
              li: ({children}) => <li className="text-text-primary">{children}</li>,
              blockquote: ({children}) => <blockquote className="border-l-4 border-pink-400 pl-4 italic text-text-secondary mb-4">{children}</blockquote>,
              code: ({children}) => <code className="bg-gray-800 text-pink-400 px-2 py-1 rounded text-sm">{children}</code>,
              pre: ({children}) => <pre className="bg-gray-800 text-text-primary p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
              strong: ({children}) => <strong className="font-bold text-text-primary">{children}</strong>,
              em: ({children}) => <em className="italic text-text-primary">{children}</em>,
              a: ({href, children}) => <a href={href} className="text-pink-400 hover:text-pink-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>,
              table: ({children}) => <table className="w-full border-collapse border border-gray-600 mb-4">{children}</table>,
              th: ({children}) => <th className="border border-gray-600 px-4 py-2 bg-gray-700 text-text-primary font-bold">{children}</th>,
              td: ({children}) => <td className="border border-gray-600 px-4 py-2 text-text-primary">{children}</td>,
            }}
          >
            {article.content}
          </ReactMarkdown>
        </article>

        {/* 分享和互动 */}
        <div className="border-t border-gray-700 pt-8 mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={handleShare}
                className="flex items-center space-x-2 text-text-secondary hover:text-pink-400 transition-colors"
              >
                <Share2 className="h-5 w-5" />
                <span>分享</span>
              </button>
            </div>
          </div>
        </div>


        {/* 相关文章 */}
        {relatedArticles.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-6">相关文章</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <article
                  key={relatedArticle.id}
                  onClick={() => router.push(`/news/${relatedArticle.id}`)}
                  className="bg-background-card rounded-lg p-6 hover:bg-gray-800/50 transition-colors cursor-pointer"
                >
                  {relatedArticle.image && (
                    <img
                      src={relatedArticle.image}
                      alt={relatedArticle.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">
                    {relatedArticle.title}
                  </h3>
                  <p className="text-text-secondary text-sm line-clamp-2 mb-3">
                    {relatedArticle.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-text-muted">
                    <span>{relatedArticle.author}</span>
                    <span>{new Date(relatedArticle.published_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
