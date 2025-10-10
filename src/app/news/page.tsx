'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Clock, Eye, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface NewsArticle {
  id: number
  title: string
  excerpt: string
  category: string
  image: string
  author: string
  read_time: string
  views: number
  featured: number
  published_at: string
}


export default function NewsPage() {
  const [featuredNews, setFeaturedNews] = useState<NewsArticle | null>(null)
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([])
  const [categories, setCategories] = useState<string[]>(['全部'])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 搜索和筛选状态
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [page, setPage] = useState(1)

  // 获取头条新闻
  const fetchFeaturedNews = async () => {
    try {
      const response = await fetch('/v1/news/public?operation=featured')
      const data = await response.json()
      
      if (data.api_code == 200) {
        setFeaturedNews(data.data)
      }
    } catch (err) {
      console.error('获取头条新闻失败:', err)
    }
  }

  // 获取新闻列表
  const fetchLatestNews = async () => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(selectedCategory !== '全部' && { category: selectedCategory })
      })

      const response = await fetch(`/v1/news/list?${params}`)
      const data = await response.json()
      
      if (data.api_code == 200) {
        setLatestNews(data.data.articles)
      } else {
        setError(data.api_msg || '获取新闻失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    }
  }

  // 获取分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/v1/news/public?operation=categories')
      const data = await response.json()
      
      if (data.api_code == 200) {
        // 从后台获取的分类数据现在包含更多信息，按排序字段排序
        const categoryNames = ['全部', ...data.data.categories.map((cat: any) => cat.name)]
        setCategories(categoryNames)
      }
    } catch (err) {
      console.error('获取分类失败:', err)
    }
  }


  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchFeaturedNews(),
        fetchLatestNews(),
        fetchCategories()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [page, search, selectedCategory])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchLatestNews()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    
    if (hours < 1) return "刚刚"
    if (hours < 24) return `${hours}小时前`
    return date.toLocaleDateString('zh-CN')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-primary-light bg-clip-text text-transparent">
            行业资讯
          </h1>
          <p className="text-xl text-text-secondary max-w-3xl mx-auto">
            第一时间获取区块链行业最新动态，掌握市场脉搏
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-background-card rounded-xl p-6 mb-8 space-y-6">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索新闻标题、关键词..."
                className="w-full pl-10 pr-4 py-3 bg-background border border-gray-700 rounded-lg focus:border-primary focus:outline-none text-text-primary"
              />
            </div>
            <button type="submit" className="flex items-center space-x-2 px-6 py-3 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors">
              <Search className="h-5 w-5" />
              <span>搜索</span>
            </button>
          </form>
          
          {/* Category Filter */}
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">按分类筛选</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedCategory === category
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-gray-700 hover:border-primary hover:bg-primary/10 text-text-secondary hover:text-primary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto">
          {/* Featured News - 只在没有筛选时显示 */}
          {!search && selectedCategory === '全部' && (
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-6">
                <TrendingUp className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-bold text-text-primary">头条新闻</h2>
              </div>
              
              {featuredNews ? (
                <Link href={`/news/${featuredNews.id}`}>
                  <article className="bg-background-card rounded-xl overflow-hidden hover-glow transition-all cursor-pointer">
                    <div className="h-64 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                      {featuredNews.image && (
                        <img 
                          src={featuredNews.image} 
                          alt={featuredNews.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                          {featuredNews.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-2xl font-bold mb-4 text-text-primary hover:text-primary transition-colors">
                        {featuredNews.title}
                      </h3>
                      
                      <p className="text-text-muted mb-6 leading-relaxed">
                        {featuredNews.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <div className="flex items-center space-x-4">
                          <span>作者: {featuredNews.author}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{featuredNews.read_time}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{featuredNews.views.toLocaleString()}</span>
                          </div>
                          <time>{formatDate(featuredNews.published_at)}</time>
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              ) : (
                <div className="bg-background-card rounded-xl p-8 text-center text-text-muted">
                  {loading ? '加载中...' : '暂无头条新闻'}
                </div>
              )}
            </div>
          )}

          {/* News List */}
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-6">
              {search || selectedCategory !== '全部' ? '搜索结果' : '最新资讯'}
            </h2>
            <div className="space-y-6">
                {loading ? (
                  <div className="text-center text-text-muted py-8">加载中...</div>
                ) : latestNews.length > 0 ? (
                  latestNews.map((news) => (
                    <article key={news.id} className="bg-background-card rounded-xl p-6 hover-glow transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                          {news.category}
                        </span>
                        <time className="text-text-muted text-sm">
                          {formatDate(news.published_at)}
                        </time>
                      </div>
                      
                      <Link href={`/news/${news.id}`}>
                        <h3 className="text-xl font-semibold mb-3 text-text-primary hover:text-primary transition-colors cursor-pointer">
                          {news.title}
                        </h3>
                      </Link>
                      
                      <p className="text-text-muted mb-4 leading-relaxed">
                        {news.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-text-muted">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{news.read_time}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{news.views.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="text-center text-text-muted py-8">
                    {error || '暂无新闻数据'}
                  </div>
                )}
              </div>
            </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="bg-background-card hover:bg-primary/10 border border-gray-700 hover:border-primary text-text-secondary hover:text-primary px-8 py-3 rounded-lg font-medium transition-all">
            加载更多新闻
          </button>
        </div>
      </div>
    </div>
  )
}
