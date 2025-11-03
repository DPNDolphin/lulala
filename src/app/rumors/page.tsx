'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { 
  MessageSquare, 
  ThumbsUp, 
  Send, 
  Clock, 
  User,
  TrendingUp,
  TrendingDown,
  Eye,
  Hash,
  Filter,
  Plus,
  X,
  Wallet,
  Heart,
  Share2,
  Egg
} from 'lucide-react'
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  TelegramShareButton, 
  WhatsappShareButton,
  FacebookIcon,
  TwitterIcon,
  TelegramIcon,
  WhatsappIcon
} from 'react-share'
import { getRumors, createRumor, interactRumor, Rumor, CreateRumorData, InteractionData } from '@/lib/rumorsAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { useToast } from '@/components/Toast'
import EvidenceInput from '@/components/EvidenceInput'
import EvidenceModal from '@/components/EvidenceModal'
import UserRankCard from '@/components/UserRankCard'

interface UserInteraction {
  rumorId: string
  interactionType: 'like' | 'dislike' | 'flower' | 'egg'
}

export default function RumorsPage() {
  const { address, isConnected } = useAccount()
  const { isAuthenticated, user, loading: authLoading } = useMultiAuth()
  const { showWarning, showSuccess, showError, ToastContainer } = useToast()
  const [rumors, setRumors] = useState<Rumor[]>([])
  const [userInteractions, setUserInteractions] = useState<UserInteraction[]>([])
  const [newRumor, setNewRumor] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSort, setSelectedSort] = useState<string>('latest')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showNewRumorForm, setShowNewRumorForm] = useState(false)
  const [newRumorCategory, setNewRumorCategory] = useState<'bullish' | 'bearish' | 'neutral' | 'news'>('neutral')
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null)
  
  // 新的表单字段
  const [formTitle, setFormTitle] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCredibility, setFormCredibility] = useState('')
  const [formEvidence, setFormEvidence] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // 证据弹窗状态
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false)
  const [selectedRumorId, setSelectedRumorId] = useState('')
  const [selectedRumorTitle, setSelectedRumorTitle] = useState('')

  // 初始化组件
  useEffect(() => {
    setMounted(true)
  }, [])

  // 打开证据弹窗
  const openEvidenceModal = (rumorId: string, rumorTitle: string) => {
    setSelectedRumorId(rumorId)
    setSelectedRumorTitle(rumorTitle)
    setEvidenceModalOpen(true)
  }

  // 关闭证据弹窗
  const closeEvidenceModal = () => {
    setEvidenceModalOpen(false)
    setSelectedRumorId('')
    setSelectedRumorTitle('')
  }



  // 加载小道消息数据
  const loadRumors = async () => {
    setLoading(true)
    try {
      const categoryParam = selectedCategory === 'all' ? undefined : selectedCategory
      const sortParam = selectedSort === 'latest' ? undefined : selectedSort
      const statusParam = selectedStatus === 'all' ? undefined : selectedStatus
      
      console.log('加载小道消息，筛选条件:', { category: categoryParam, sort: sortParam, status: statusParam })
      const data = await getRumors({ 
        category: categoryParam,
        sort: sortParam,
        status: statusParam
      })
      console.log('API返回数据:', data)
      setRumors(data.rumors || [])
      
      // 用户互动状态将在用户点击互动按钮时加载
    } catch (error) {
      console.error('加载小道消息失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 当筛选条件变化时重新加载数据
  useEffect(() => {
    if (mounted) {
      loadRumors()
    }
  }, [selectedCategory, selectedSort, selectedStatus,mounted])

  // 点击外部关闭分享菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showShareMenu) {
        setShowShareMenu(null)
      }
    }

    if (showShareMenu) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [showShareMenu])

  const categories = [
    { value: 'all', label: '全部', color: 'text-gray-400' },
    { value: 'exchange', label: '交易所', color: 'text-blue-400' },
    { value: 'project', label: '项目方', color: 'text-green-400' },
    { value: 'funding', label: '融资', color: 'text-purple-400' },
    { value: 'security', label: '安全', color: 'text-red-400' },
    { value: 'policy', label: '政策', color: 'text-yellow-400' },
    { value: 'airdrop', label: '空投', color: 'text-pink-400' }
  ]

  const sortOptions = [
    { value: 'latest', label: '最新', icon: '🕒' },
    { value: 'hot', label: '热度', icon: '🔥' }
  ]

  const statusOptions = [
    { value: 'all', label: '全部', color: 'text-gray-400' },
    { value: 'pending', label: '待验证', color: 'text-yellow-400' },
    { value: 'verified', label: '已验证', color: 'text-green-400' },
    { value: 'disproven', label: '已证伪', color: 'text-pink-400' }
  ]


  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bullish': return <TrendingUp className="h-4 w-4" />
      case 'bearish': return <TrendingDown className="h-4 w-4" />
      case 'news': return <MessageSquare className="h-4 w-4" />
      default: return <Hash className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'exchange': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'project': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'funding': return 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      case 'security': return 'text-red-400 bg-red-400/10 border-red-400/30'
      case 'policy': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'airdrop': return 'text-pink-400 bg-pink-400/10 border-pink-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'verified': return { label: '已验证', color: 'text-green-400 bg-green-400/10' }
      case 'disproven': return { label: '已证伪', color: 'text-pink-400 bg-pink-400/10' }
      default: return { label: '待验证', color: 'text-yellow-400 bg-yellow-400/10' }
    }
  }

  const getUserLevel = (vipLevel: number) => {
    if (vipLevel >= 3) return 'L3+'
    if (vipLevel >= 2) return 'L2'
    if (vipLevel >= 1) return 'L1'
    return 'L0'
  }


  const getUserInteraction = (rumorId: string, interactionType: 'like' | 'dislike' | 'flower' | 'egg') => {
    return userInteractions.find(interaction => 
      interaction.rumorId === rumorId && interaction.interactionType === interactionType
    )
  }


  const handleInteraction = async (rumorId: string, interactionType: 'like' | 'dislike' | 'flower' | 'egg') => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录才能互动')
      return
    }

    try {
      const interactionData: InteractionData = {
        rumor_id: parseInt(rumorId),
        interaction_type: interactionType
      }
      
      const result = await interactRumor(interactionData)
      
      // 更新本地状态
      setRumors(prev => prev.map(rumor => 
        rumor.id === rumorId 
          ? { 
              ...rumor, 
              likes: result.likes, 
              dislikes: result.dislikes,
              flowers: result.flowers,
              eggs: result.eggs
            }
          : rumor
      ))
      
      // 更新用户互动记录
      if (result.user_interaction) {
        setUserInteractions(prev => {
          const existing = prev.find(interaction => 
            interaction.rumorId === rumorId && interaction.interactionType === interactionType
          )
          if (existing) {
            return prev.map(interaction => 
              interaction.rumorId === rumorId && interaction.interactionType === interactionType
                ? { ...interaction, interactionType: result.user_interaction! }
                : interaction
            )
          } else {
            return [...prev, { rumorId, interactionType: result.user_interaction! }]
          }
        })
      } else {
        // 取消互动
        setUserInteractions(prev => prev.filter(interaction => 
          !(interaction.rumorId === rumorId && interaction.interactionType === interactionType)
        ))
      }
    } catch (error) {
      console.error('互动失败:', error)
      showError('互动失败', '请重试')
    }
  }

  const handleShareClick = (rumorId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setShowShareMenu(showShareMenu === rumorId ? null : rumorId)
  }

  const getShareUrl = (rumorId: string) => {
    return `${window.location.origin}/rumors?id=${rumorId}`
  }

  const getShareTitle = (rumor: Rumor) => {
    return `小道消息: ${rumor.title || rumor.content.substring(0, 50)}...`
  }

  const handleSubmitRumor = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录才能发布消息')
      return
    }

    if (!formTitle.trim()) {
      showWarning('输入错误', '请输入一句话标题')
      return
    }

    if (!formCategory) {
      showWarning('输入错误', '请选择类别')
      return
    }

    if (!formCredibility) {
      showWarning('输入错误', '请选择可信度')
      return
    }

    try {
      const createData: CreateRumorData = {
        title: formTitle.trim(),
        content: formTitle.trim(), // 标题作为内容
        category: formCategory as any,
        credibility: parseInt(formCredibility),
        evidence: formEvidence.trim() || undefined,
        wallet_address: user?.wallet_address || ''
      }
      
      await createRumor(createData)
      
      // 清空表单
      setFormTitle('')
      setFormCategory('')
      setFormCredibility('')
      setFormEvidence('')
      setShowNewRumorForm(false)
      
      // 重新加载数据
      loadRumors()
      
      showSuccess('发布成功！', '您的小道消息已成功发布')
    } catch (error) {
      console.error('发布失败:', error)
      showError('发布失败', '请重试')
    }
  }


  // 服务端已经处理了筛选，直接使用rumors
  const filteredRumors = rumors || []

  // 防止水合错误
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
            <p className="text-text-secondary mt-4">加载中...</p>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-8">
          {/* 左侧：标题和slogan */}
          <div className="flex-1">
            <div className="flex items-center mb-2">
              <MessageSquare className="h-8 w-8 text-pink-400 mr-3" />
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
                小道消息
              </h1>
              <a
                href="/r"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors underline hover:no-underline"
              >
                全网交易所下载/注册
              </a>
            </div>
            <p className="text-sm text-text-secondary">
              人人可发 · 人人可证 · 三人带证据=建议结论
            </p>
          </div>

          {/* 右侧：发布按钮 */}
          <div className="ml-6">
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  showWarning('需要登录', '请先登录才能发布消息')
                  return
                }
                setShowNewRumorForm(!showNewRumorForm)
              }}
              className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>发布</span>
            </button>
          </div>
        </div>

        {/* Tips 区域 */}
        <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-400/20 rounded-full flex items-center justify-center">
              <span className="text-blue-400 text-sm font-bold">💡</span>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-400 mb-2">一分钟上手：</h3>
              <div className="text-sm text-text-secondary leading-relaxed space-y-1">
                <p><span className="text-blue-400 font-medium">①</span> 填标题 + 类别 + 可信度 → 发布（状态=待验证）</p>
                <p><span className="text-blue-400 font-medium">②</span> 看到好线索点 🧪 求证 上传证据（链接/截图）</p>
                <p><span className="text-blue-400 font-medium">③</span> 同一条线索有 3 位 L3+ 提交同向证据 → 形成"社区建议结论"。管理员确认后改为 <span className="text-green-400 font-medium">已验证</span> 或 <span className="text-pink-400 font-medium">已证伪</span>。</p>
              </div>
            </div>
          </div>
        </div>

        {/* 新消息表单 */}
        {showNewRumorForm && (
          <div className="bg-background-card rounded-xl p-6 border border-gray-700 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">发布新消息</h3>
              <button
                onClick={() => setShowNewRumorForm(false)}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 第一行：标题、类别、可信度 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 标题 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    一句话标题 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="如：某交易所将上线XX"
                    className="w-full bg-background-secondary border border-gray-600 rounded-lg p-3 text-text-primary placeholder-text-muted focus:border-pink-400 focus:outline-none"
                  />
                </div>

                {/* 类别选择 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    类别 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-background-secondary border border-gray-600 rounded-lg p-3 text-text-primary focus:border-pink-400 focus:outline-none"
                  >
                    <option value="">请选择类别</option>
                    <option value="exchange">交易所</option>
                    <option value="project">项目方</option>
                    <option value="funding">融资</option>
                    <option value="security">安全</option>
                    <option value="policy">政策</option>
                    <option value="airdrop">空投</option>
                  </select>
                </div>

                {/* 可信度选择 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    可信度 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formCredibility}
                    onChange={(e) => setFormCredibility(e.target.value)}
                    className="w-full bg-background-secondary border border-gray-600 rounded-lg p-3 text-text-primary focus:border-pink-400 focus:outline-none"
                  >
                    <option value="">请选择可信度</option>
                    <option value="30">30%</option>
                    <option value="50">50%</option>
                    <option value="70">70%</option>
                    <option value="90">90%</option>
                  </select>
                </div>
              </div>

              {/* 第三行：证据输入 */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  证据 <span className="text-text-muted">(可选)</span>
                </label>
                <EvidenceInput
                  value={formEvidence}
                  onChange={setFormEvidence}
                />
              </div>

              {/* 提交按钮 */}
              <div className="flex space-x-3">
                <button
                  onClick={handleSubmitRumor}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  <Send className="h-4 w-4" />
                  <span>发布</span>
                </button>
                <button
                  onClick={() => setShowNewRumorForm(false)}
                  className="px-6 py-2 bg-background-secondary border border-gray-600 text-text-secondary rounded-lg hover:border-gray-500 transition-all"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 筛选器 */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <Filter className="h-4 w-4 text-text-secondary" />
            <span className="text-sm text-text-secondary">筛选:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.value}
                  onClick={() => setSelectedCategory(category.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    selectedCategory === category.value
                      ? `${category.color} bg-opacity-10 border-current`
                      : 'bg-background-secondary border-gray-600 text-text-secondary hover:border-gray-500'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
            
            {/* 排序下拉框 */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-text-secondary">排序:</span>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                className="bg-background-secondary border border-gray-600 rounded-lg px-3 py-1 text-xs text-text-primary focus:border-pink-400 focus:outline-none"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 状态下拉框 */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-text-secondary">状态:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-background-secondary border border-gray-600 rounded-lg px-3 py-1 text-xs text-text-primary focus:border-pink-400 focus:outline-none"
              >
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 消息列表 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <div className="col-span-full text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
              <p className="text-text-secondary mt-4">加载中...</p>
            </div>
          ) : (
            (rumors || []).map((rumor) => {
              const isAuthor = user?.wallet_address === rumor.authorAddress
              const statusInfo = getStatusInfo(rumor.status || 'pending')
              const userLevel = getUserLevel(rumor.authorVipLevel || 0)

              return (
                <div
                  key={rumor.id}
                  className="bg-background-card rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-all"
                >
                  {/* 第一块：消息信息 */}
                  <div className="mb-4">
                    <div className="flex items-start space-x-3">
                      {/* 用户头像 */}
                      <div className="flex-shrink-0">
                        {rumor.authorAvatar ? (
                          <img 
                            src={rumor.authorAvatar} 
                            alt={rumor.author}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-pink-600 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                      </div>

                      {/* 消息内容区域 */}
                      <div className="flex-1 min-w-0">
                        {/* 第一行：用户昵称 等级 消息状态 时间 */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            <span className="text-text-secondary text-xs truncate">
                              <span className="text-text-muted">@</span>{rumor.author}
                            </span>
                            <span className="text-xs text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded flex-shrink-0">{userLevel}</span>
                            <span className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                            {isAuthor && (
                              <span className="bg-pink-400/10 text-pink-400 px-2 py-0.5 rounded text-xs flex-shrink-0">
                                我的
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-text-muted flex-shrink-0 ml-2">
                            <Clock className="h-3 w-3" />
                            <span className="hidden sm:inline">{new Date(rumor.timestamp).toLocaleDateString()}</span>
                            <span className="sm:hidden">{new Date(rumor.timestamp).toLocaleDateString().slice(5)}</span>
                          </div>
                        </div>

                        {/* 第二行：消息标题 */}
                        <div className="mb-2">
                          <h3 className="text-text-primary font-semibold text-base leading-tight line-clamp-2">
                            {rumor.title || rumor.content.split('\n')[0]}
                          </h3>
                        </div>

                        {/* 第三行：可信度，类别，证据数 */}
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-yellow-400">可信度: {rumor.credibility || 0}%</span>
                          <span className="text-text-muted">•</span>
                          <span className={`px-2 py-0.5 rounded ${getCategoryColor(rumor.category)}`}>
                            {categories.find(c => c.value === rumor.category)?.label || '其他'}
                          </span>
                          <span className="text-text-muted">•</span>
                          <button
                            onClick={() => openEvidenceModal(rumor.id, rumor.title)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer
                                       text-white bg-blue-600 border-blue-600 hover:bg-blue-700 hover:border-blue-700
                                       dark:text-blue-300 dark:bg-blue-500/10 dark:border-blue-500/30 dark:hover:bg-blue-500/20
                                       focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                          >
                            <Eye className="h-3 w-3" />
                            <span>证据: {rumor.evidence_count || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 第二块：互动按钮 */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-700">
                    <div className="flex items-center space-x-4">
                      {/* 点赞 */}
                      <button
                        onClick={() => handleInteraction(rumor.id, 'like')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all text-xs ${
                          getUserInteraction(rumor.id, 'like')
                            ? 'bg-green-400/20 text-green-400'
                            : 'text-text-muted hover:text-green-400 hover:bg-green-400/10'
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>{rumor.likes}</span>
                      </button>

                      {/* 鲜花 */}
                      <button 
                        onClick={() => handleInteraction(rumor.id, 'flower')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all text-xs ${
                          getUserInteraction(rumor.id, 'flower')
                            ? 'bg-pink-400/20 text-pink-400'
                            : 'text-text-muted hover:text-pink-400 hover:bg-pink-400/10'
                        }`}
                      >
                        <Heart className="h-3 w-3" />
                        <span>{rumor.flowers || 0}</span>
                      </button>

                      {/* 扔鸡蛋 */}
                      <button 
                        onClick={() => handleInteraction(rumor.id, 'egg')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg transition-all text-xs ${
                          getUserInteraction(rumor.id, 'egg')
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'text-text-muted hover:text-yellow-400 hover:bg-yellow-400/10'
                        }`}
                      >
                        <Egg className="h-3 w-3" />
                        <span>{rumor.eggs || 0}</span>
                      </button>
                    </div>

                    {/* 分享 */}
                    <div className="relative">
                      <button 
                        onClick={(e) => handleShareClick(rumor.id, e)}
                        className="flex items-center space-x-1 px-2 py-1 rounded-lg transition-all text-xs text-text-muted hover:text-blue-400 hover:bg-blue-400/10"
                      >
                        <Share2 className="h-3 w-3" />
                        <span>分享</span>
                      </button>
                      
                      {/* 分享菜单 */}
                      {showShareMenu === rumor.id && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50 min-w-max
                                   sm:left-1/2 sm:transform sm:-translate-x-1/2
                                   md:left-0 md:transform-none
                                   lg:left-0 lg:transform-none
                                   max-w-[calc(100vw-2rem)] mx-auto">
                          <div className="flex space-x-2 flex-wrap justify-center sm:justify-start gap-2">
                            <FacebookShareButton
                              url={getShareUrl(rumor.id)}
                              className="transition-transform hover:scale-110 flex-shrink-0"
                            >
                              <FacebookIcon size={28} round />
                            </FacebookShareButton>
                            
                            <TwitterShareButton
                              url={getShareUrl(rumor.id)}
                              title={getShareTitle(rumor)}
                              className="transition-transform hover:scale-110 flex-shrink-0"
                            >
                              <TwitterIcon size={28} round />
                            </TwitterShareButton>
                            
                            <TelegramShareButton
                              url={getShareUrl(rumor.id)}
                              title={getShareTitle(rumor)}
                              className="transition-transform hover:scale-110 flex-shrink-0"
                            >
                              <TelegramIcon size={28} round />
                            </TelegramShareButton>
                            
                            <WhatsappShareButton
                              url={getShareUrl(rumor.id)}
                              title={getShareTitle(rumor)}
                              className="transition-transform hover:scale-110 flex-shrink-0"
                            >
                              <WhatsappIcon size={28} round />
                            </WhatsappShareButton>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* 空状态 */}
        {!loading && (rumors || []).length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-secondary mb-2">暂无消息</h3>
            <p className="text-text-muted">成为第一个分享消息的人吧！</p>
          </div>
        )}

        {/* 我的威望 */}
        <div className="mt-8">
          <UserRankCard />
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-blue-400/10 border border-blue-400/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">使用说明</h3>
          <div className="space-y-2 text-text-secondary text-sm">
            <p>• 小道消息仅供参考</p>
            <p>• 请理性判断消息真实性，独立思考后做出决策</p>
            <p>• 禁止发布虚假信息或恶意传播谣言</p>
            <p>• 尊重他人观点，理性讨论</p>
          </div>
        </div>
      </div>
      
      {/* 证据弹窗 */}
      <EvidenceModal
        isOpen={evidenceModalOpen}
        onClose={closeEvidenceModal}
        rumorId={selectedRumorId}
        rumorTitle={selectedRumorTitle}
      />
      
      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  )
}
