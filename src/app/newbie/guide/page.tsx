'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Search, Filter, Clock, Eye, BookOpen, Wrench, Building2, ExternalLink } from 'lucide-react'
import { newsAPI, NewbieArticle } from '@/lib/publicAPI'

type Section = 'guide' | 'toolkit' | 'exchanges'

export default function NewbieGuidePage() {
  const [articles, setArticles] = useState<NewbieArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedSection, setSelectedSection] = useState<Section | 'all'>('all')

  const sections = [
    { key: 'all', label: '全部', icon: BookOpen, color: 'text-gray-400' },
    { key: 'guide', label: '新手指南', icon: BookOpen, color: 'text-pink-400' },
    { key: 'toolkit', label: '工具包', icon: Wrench, color: 'text-purple-400' },
    { key: 'exchanges', label: '交易所', icon: Building2, color: 'text-blue-400' }
  ]

  // 获取新手村文章
  const fetchArticles = async (section?: Section) => {
    try {
      setLoading(true)
      setError('')
      const response = await newsAPI.getNewbieArticles(section)
      
      if (response.api_code == 200) {
        setArticles(response.data || [])
      } else {
        setError(response.api_msg || '获取文章失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (selectedSection === 'all') {
      fetchArticles()
    } else {
      fetchArticles(selectedSection as Section)
    }
  }, [selectedSection])

  // 过滤文章
  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(search.toLowerCase()) ||
    article.excerpt.toLowerCase().includes(search.toLowerCase())
  )

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'guide': return BookOpen
      case 'toolkit': return Wrench
      case 'exchanges': return Building2
      default: return BookOpen
    }
  }

  const getSectionColor = (section: string) => {
    switch (section) {
      case 'guide': return 'text-pink-400'
      case 'toolkit': return 'text-purple-400'
      case 'exchanges': return 'text-blue-400'
      default: return 'text-gray-400'
    }
  }

  const getSectionBgColor = (section: string) => {
    switch (section) {
      case 'guide': return 'from-pink-500/20 to-rose-500/20'
      case 'toolkit': return 'from-purple-500/20 to-violet-500/20'
      case 'exchanges': return 'from-blue-500/20 to-cyan-500/20'
      default: return 'from-gray-500/20 to-slate-500/20'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center mb-6">
            <Link 
              href="/"
              className="flex items-center text-text-muted hover:text-primary transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              返回首页
            </Link>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-400/10 via-purple-400/10 to-blue-400/10 p-4 rounded-2xl w-fit mx-auto mb-6">
              <BookOpen className="h-12 w-12 text-pink-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-text-primary">
              🏕️ 新手村
            </h1>
            <p className="text-xl text-text-secondary max-w-3xl mx-auto">
              Web3世界的入门指南，从零开始成为区块链达人
            </p>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {sections.map((section) => {
            const Icon = section.icon
            return (
              <button
                key={section.key}
                onClick={() => setSelectedSection(section.key as Section | 'all')}
                className={`flex items-center px-6 py-3 rounded-lg transition-all ${
                  selectedSection === section.key
                    ? 'bg-primary text-white'
                    : 'bg-background-card text-text-muted hover:bg-background-secondary'
                }`}
              >
                <Icon className={`h-5 w-5 mr-2 ${
                  selectedSection === section.key ? 'text-white' : section.color
                }`} />
                {section.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-muted" />
          <input
            type="text"
            placeholder="搜索文章..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-background-card border border-gray-700 rounded-lg focus:border-primary focus:outline-none text-text-primary"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Articles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-background-card rounded-xl p-6 animate-pulse">
                <div className="h-48 bg-gray-700 rounded-lg mb-4"></div>
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-700 rounded w-20"></div>
                  <div className="h-3 bg-gray-700 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => {
              const SectionIcon = getSectionIcon(article.section || 'guide')
              const sectionColor = getSectionColor(article.section || 'guide')
              const sectionBgColor = getSectionBgColor(article.section || 'guide')
              
              return (
                <Link
                  key={article.id}
                  href={`/news/${article.id}`}
                  className="bg-background-card rounded-xl overflow-hidden hover-glow hover:scale-105 transition-all group"
                >
                  <div className={`h-48 bg-gradient-to-br ${sectionBgColor} relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                    <div className="absolute top-4 left-4">
                      <span className={`bg-white/90 ${sectionColor} px-3 py-1 rounded-full text-sm font-medium flex items-center`}>
                        <SectionIcon className="h-4 w-4 mr-1" />
                        {article.category}
                      </span>
                    </div>
                    <div className="absolute bottom-4 right-4">
                      <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-lg font-semibold mb-3 text-text-primary group-hover:text-primary transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-text-muted text-sm leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-text-muted">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.read_time}
                        </div>
                        <div className="flex items-center">
                          <Eye className="h-4 w-4 mr-1" />
                          {article.views}
                        </div>
                      </div>
                      <span className="text-primary font-medium">
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">
              {search ? '没有找到相关文章' : '暂无文章'}
            </h3>
            <p className="text-text-muted">
              {search ? '尝试使用其他关键词搜索' : '文章内容正在准备中，敬请期待'}
            </p>
          </div>
        )}

        {/* Quick Navigation */}
        <div className="mt-16 bg-background-secondary rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">
            新手村导航
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-pink-500/10 p-6 rounded-xl w-fit mx-auto mb-4">
                <BookOpen className="h-12 w-12 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">新手指南</h3>
              <p className="text-text-muted mb-4">
                从零开始学习区块链和加密货币基础知识
              </p>
              <button
                onClick={() => setSelectedSection('guide')}
                className="text-pink-400 hover:text-pink-300 font-medium"
              >
                查看指南 →
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-500/10 p-6 rounded-xl w-fit mx-auto mb-4">
                <Wrench className="h-12 w-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">工具包</h3>
              <p className="text-text-muted mb-4">
                必备的区块链工具和实用资源合集
              </p>
              <button
                onClick={() => setSelectedSection('toolkit')}
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                查看工具 →
              </button>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-500/10 p-6 rounded-xl w-fit mx-auto mb-4">
                <Building2 className="h-12 w-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">交易所</h3>
              <p className="text-text-muted mb-4">
                主流交易所评测和使用教程
              </p>
              <button
                onClick={() => setSelectedSection('exchanges')}
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                查看交易所 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}