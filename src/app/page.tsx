'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, TrendingUp, BarChart3, Shield, Users, Globe, Star, Eye, Clock, BookOpen, Wrench, Building2 } from 'lucide-react'
import NewsCard from '@/components/NewsCard'
import MarketStats from '@/components/MarketStats'
import NoSSR from '@/components/NoSSR'
import ParticleAnimation from '@/components/ParticleAnimation'
import { newsAPI, NewbieArticle, NewsArticle } from '@/lib/publicAPI'

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [hasAutoScrolled, setHasAutoScrolled] = useState(false)
  const [showScrollHint, setShowScrollHint] = useState(false)
  const router = useRouter()

  // 新手村数据状态
  const [newbieVillageData, setNewbieVillageData] = useState<{
    guide: NewbieArticle[]
    toolkit: NewbieArticle[]
    exchanges: NewbieArticle[]
  }>({
    guide: [],
    toolkit: [],
    exchanges: []
  })
  const [newbieLoading, setNewbieLoading] = useState(true)

  // 最新资讯数据状态
  const [latestNews, setLatestNews] = useState<NewsArticle[]>([])
  const [newsLoading, setNewsLoading] = useState(true)

  // 页面加载完成后，延迟3秒自动跳转到下一屏（只跳一次）
  useEffect(() => {
    if (!hasAutoScrolled) {
      const autoScrollTimer = setTimeout(() => {
        setHasAutoScrolled(true)
        const nextSection = document.getElementById('market-stats')
        if (nextSection) {
          nextSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 3000) // 3秒后自动跳转

      return () => clearTimeout(autoScrollTimer)
    }
  }, [hasAutoScrolled])

  // 获取新手村数据
  useEffect(() => {
    const fetchNewbieData = async () => {
      try {
        setNewbieLoading(true)
        const [guideRes, toolkitRes, exchangesRes] = await Promise.all([
          newsAPI.getNewbieArticles('guide'),
          newsAPI.getNewbieArticles('toolkit'),
          newsAPI.getNewbieArticles('exchanges')
        ])

        setNewbieVillageData({
          guide: guideRes.api_code == 200 ? guideRes.data || [] : [],
          toolkit: toolkitRes.api_code == 200 ? toolkitRes.data || [] : [],
          exchanges: exchangesRes.api_code == 200 ? exchangesRes.data || [] : []
        })
      } catch (error) {
        console.error('获取新手村数据失败:', error)
      } finally {
        setNewbieLoading(false)
      }
    }

    fetchNewbieData()
  }, [])

  // 获取最新资讯数据
  useEffect(() => {
    const fetchLatestNews = async () => {
      try {
        setNewsLoading(true)
        const response = await newsAPI.getLatestNews(3)
        if (response.api_code == 200) {
          setLatestNews(response.data || [])
        }
      } catch (error) {
        console.error('获取最新资讯失败:', error)
      } finally {
        setNewsLoading(false)
      }
    }

    fetchLatestNews()
  }, [])

  const heroSlides = [
    
    {
      title: "Lulala投研发现下一个值得布局的Alpha项目",
      subtitle: "Web3世界中的专业研判机构，用数据说话、为您提前详判趋势",
      image: "/api/placeholder/800/400",
      link: "/research",
    },
    {
      title: "币安Alpha",
      subtitle: "热门项目实时追踪，领先一步抢占红利",
      image: "/api/placeholder/800/400",
      link: "/alpha",
    }
  ]

  const newbieVillageSections = [
    {
      icon: BookOpen,
      title: "新手指南",
      description: "从零开始学习区块链和加密货币基础知识",
      link: "/newbie/guide",
      section: 'guide' as const
    },
    {
      icon: Wrench,
      title: "工具包",
      description: "必备的区块链工具和实用资源合集",
      link: "/newbie/guide",
      section: 'toolkit' as const
    },
    {
      icon: Building2,
      title: "交易所",
      description: "主流交易所评测和使用教程",
      link: "/newbie/guide",
      section: 'exchanges' as const
    }
  ]



  // heroslide自动播放逻辑（不再包含自动滚动）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => {
        const nextSlide = (prev + 1) % heroSlides.length
        return nextSlide
      })
    }, 5000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  return (
    <div className="lg:pl-0">
      <ParticleAnimation />
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden lg:pt-0">
        <div className="absolute inset-0 hero-gradient"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-primary-light bg-clip-text text-transparent">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto leading-relaxed">
              {heroSlides[currentSlide].subtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => router.push(heroSlides[currentSlide].link)}
              className="border-2 border-primary text-primary hover:bg-primary hover:text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105"
            >
              探索更多
            </button>
          </div>
        </div>
        
        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index)
                // 用户手动操作时，重置自动滚动状态
                setHasAutoScrolled(false)
                setShowScrollHint(false)
              }}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-primary scale-125' : 'bg-gray-500 hover:bg-gray-400'
              }`}
            />
            ))}
          </div>
          
          {/* 滚动提示 */}
          {showScrollHint && (
            <div className="flex items-center space-x-2 text-sm text-text-muted animate-pulse">
              <span>即将自动滚动到下一屏</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          )}
        </div>
      </section>


      {/* Market Stats Section */}
      <NoSSR fallback={
        <section id="market-stats" className="py-12 border-y border-gray-800 bg-background-secondary/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-text-primary mb-2">实时市场数据</h2>
              <p className="text-text-muted">主要加密货币价格动态</p>
            </div>
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <TrendingUp className="h-8 w-8 text-primary animate-pulse mx-auto mb-4" />
                <p className="text-text-muted">加载市场数据中...</p>
              </div>
            </div>
          </div>
        </section>
      }>
        <div id="market-stats">
          <MarketStats />
        </div>
      </NoSSR>

      {/* Newbie Village Section */}
      <section className="py-20 bg-background-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-text-primary">
              🏕️ 新手村
            </h2>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Web3世界的入门指南，从零开始成为区块链达人
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newbieLoading ? (
              // 加载状态
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-background-card rounded-xl p-6 animate-pulse">
                  <div className="bg-gray-700 p-3 rounded-lg w-fit mb-4 h-14 w-14"></div>
                  <div className="h-6 bg-gray-700 rounded mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-700 rounded"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))
            ) : (
              newbieVillageSections.map((section, index) => {
                const articles = newbieVillageData[section.section] || []
                return (
                  <Link
                    key={index}
                    href={section.link}
                    className="bg-background-card rounded-xl p-6 hover-glow hover:scale-105 transition-all group"
                  >
                    <div className="bg-pink-400/10 p-3 rounded-lg w-fit mb-4 group-hover:bg-pink-400/20 transition-all">
                      <section.icon className="h-8 w-8 text-pink-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-text-primary group-hover:text-pink-400 transition-colors">
                      {section.title}
                    </h3>
                    <p className="text-text-muted leading-relaxed mb-4">
                      {section.description}
                    </p>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-text-secondary mb-2">包含文章：</div>
                      {articles.length > 0 ? (
                        <>
                          {articles.slice(0, 2).map((article, idx) => (
                            <div key={idx} className="text-sm text-text-muted flex items-start space-x-2">
                              <span className="text-pink-400 mt-1">•</span>
                              <span className="line-clamp-1">{article.title}</span>
                            </div>
                          ))}
                          {articles.length > 2 && (
                            <div className="text-xs text-pink-400 mt-2">
                              +{articles.length - 2} 更多文章
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-text-muted">暂无文章</div>
                      )}
                    </div>
                    <div className="flex items-center mt-4 text-pink-400 group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium">进入学习</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* Latest News Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-text-primary">
                最新资讯
              </h2>
              <p className="text-xl text-text-secondary">
                掌握区块链行业最新动态
              </p>
            </div>
            <Link 
              href="/news"
              className="mt-4 md:mt-0 text-primary hover:text-primary-light font-semibold flex items-center group transition-colors"
            >
              查看全部
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {newsLoading ? (
              // 加载状态
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-background-card rounded-xl p-6 animate-pulse">
                  <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-gray-700 rounded w-20"></div>
                    <div className="h-3 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : latestNews.length > 0 ? (
              latestNews.map((news) => (
                <NewsCard key={news.id} news={{
                  id: news.id,
                  title: news.title,
                  excerpt: news.excerpt,
                  category: news.category,
                  image: news.image,
                  readTime: news.read_time,
                  views: news.views,
                  publishedAt: news.published_at,
                  timestamp: new Date(news.published_at).getTime()
                }} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-text-muted">暂无最新资讯</p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-text-primary">
            准备开始您的区块链之旅？
          </h2>
          <p className="text-xl text-text-secondary mb-8 max-w-2xl mx-auto">
            加入我们的专业社区，获取最新的研究报告和市场分析
          </p>
          
        </div>
      </section>
    </div>
  )
}
