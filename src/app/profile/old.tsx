'use client'

import { useState, useEffect } from 'react'
import { User, Heart, MessageCircle, Bookmark, Gift, Users, QrCode, Copy, Download, Star, Eye, Calendar, ExternalLink, Clock, Settings, Wallet, Crown } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { userDataAPI, ResearchActivity, AirdropRecord, AirdropActivity, InviteRecord, ResearchStats, AirdropStats, InviteStats, publicAPI, UnionInfoResponse, userProfileAPI } from '@/lib/publicAPI'
import UserProfileModal from '@/components/UserProfileModal'
import { useToast } from '@/components/Toast'


export default function ProfilePage() {
  const { isAuthenticated, user } = useMultiAuth()
  const { showSuccess, showError, showWarning, ToastContainer } = useToast()
  const [activeTab, setActiveTab] = useState<'research' | 'airdrops' | 'invite'>('research')
  const [researchSubTab, setResearchSubTab] = useState<'participate' | 'like' | 'bookmark'>('participate')
  const [airdropSubTab, setAirdropSubTab] = useState<'participate' | 'like' | 'bookmark'>('participate')
  const [showQRModal, setShowQRModal] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [isVipMember, setIsVipMember] = useState(false)
  const [isTradeMember, setIsTradeMember] = useState(false)
  const [isAmbassador, setIsAmbassador] = useState(false)
  
  // 真实数据状态
  const [researchActivities, setResearchActivities] = useState<ResearchActivity[]>([])
  const [airdropRecords, setAirdropRecords] = useState<AirdropRecord[]>([])
  const [airdropActivities, setAirdropActivities] = useState<AirdropActivity[]>([])
  const [inviteRecords, setInviteRecords] = useState<InviteRecord[]>([])
  const [unionInfo, setUnionInfo] = useState<UnionInfoResponse | null>(null)
  const [unionPage, setUnionPage] = useState(1)
  const [unionLimit] = useState(10)
  const [unionTotalPages, setUnionTotalPages] = useState(1)
  const [researchStats, setResearchStats] = useState<ResearchStats>({ participate: 0, like: 0, bookmark: 0 })
  const [airdropStats, setAirdropStats] = useState<AirdropStats>({ total: 0, completed: 0, claimed: 0, participating: 0 })
  const [airdropActivityStats, setAirdropActivityStats] = useState<ResearchStats>({ participate: 0, like: 0, bookmark: 0 })
  const [inviteStats, setInviteStats] = useState<InviteStats>({ total: 0, paid: 0, total_reward: 0 })
  const [inviteLink, setInviteLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  const [tabAnimationKey, setTabAnimationKey] = useState(0)

  // 客户端挂载标识
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 从用户数据获取会员状态
  useEffect(() => {
    if (isClient && isAuthenticated && user) {
      // 根据user.vip_level判断是否为VIP会员
      setIsVipMember(((user?.vip_level) ?? 0) > 0)
      setIsTradeMember(((user?.trade_level) ?? 0) > 0)
      setIsAmbassador((user?.usertype ?? 0) == 1)
      // 重置头像错误状态
      setAvatarError(false)
      
      // 如果当前在邀请标签页但用户类型不是1，切换到投研标签页
      if (activeTab == 'invite' && user.usertype != 1) {
        setActiveTab('research')
      }
    } else {
      setIsTradeMember(false)
      setIsVipMember(false)
      setIsAmbassador(false)
    }
  }, [isClient, isAuthenticated, user, activeTab])

  // 加载投研活动数据
  const loadResearchActivities = async () => {
    if (!isClient || !isAuthenticated) return
    
    try {
      const response = await userDataAPI.getResearchActivities(researchSubTab)
      if (response.api_code == 200 && response.data) {
        setResearchActivities(response.data.activities)
      }
    } catch (error) {
      console.error('加载投研活动失败:', error)
    }
  }

  // 加载空投活动数据
  const loadAirdropActivities = async () => {
    if (!isClient || !isAuthenticated) return
    
    try {
      const response = await userDataAPI.getAirdropActivities(airdropSubTab)
      if (response.api_code == 200 && response.data) {
        setAirdropActivities(response.data.activities)
      }
    } catch (error) {
      console.error('加载空投活动失败:', error)
    }
  }

  // 加载真实数据
  useEffect(() => {
    loadUserData()
  }, [isClient, isAuthenticated, unionPage])

  // 当投研子标签改变时重新加载投研活动数据
  useEffect(() => {
    if (isClient && isAuthenticated) {
      loadResearchActivities()
    }
  }, [researchSubTab])

  // 当空投子标签改变时重新加载空投活动数据
  useEffect(() => {
    if (isClient && isAuthenticated) {
      loadAirdropActivities()
    }
  }, [airdropSubTab])


  const getActionIcon = (action: string) => {
    switch (action) {
      case 'participate': return <User className="h-4 w-4 text-blue-400" />
      case 'like': return <Heart className="h-4 w-4 text-pink-400" />
      case 'bookmark': return <Bookmark className="h-4 w-4 text-yellow-400" />
      case 'comment': return <MessageCircle className="h-4 w-4 text-green-400" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'participate': return '参与了'
      case 'like': return '点赞了'
      case 'bookmark': return '收藏了'
      case 'comment': return '评论了'
      default: return '操作了'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="bg-green-400/10 text-green-400 px-2 py-1 rounded text-xs">已完成</span>
      case 'participated':
        return <span className="bg-yellow-400/10 text-yellow-400 px-2 py-1 rounded text-xs">进行中</span>
      case 'claimed':
        return <span className="bg-blue-400/10 text-blue-400 px-2 py-1 rounded text-xs">已领取</span>
      default:
        return <span className="bg-gray-400/10 text-gray-400 px-2 py-1 rounded text-xs">未知</span>
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 提取邀请码
  const getInviteCode = () => {
    try {
      const url = new URL(inviteLink)
      const uid = url.searchParams.get('uid')
      return uid || ''
    } catch (err) {
      console.error('提取邀请码失败:', err)
      return ''
    }
  }

  // 复制邀请码
  const handleCopyCode = async () => {
    try {
      const code = getInviteCode()
      if (code) {
        await navigator.clipboard.writeText(code)
        setCopyCodeSuccess(true)
        setTimeout(() => setCopyCodeSuccess(false), 2000)
      }
    } catch (err) {
      console.error('复制邀请码失败:', err)
    }
  }

  const handleSaveProfile = async (profile: { nickname: string; avatar: string }) => {
    if (!user) {
      throw new Error('用户信息不存在')
    }
    
    try {
      const response = await publicAPI.post('/v1/users/profile', {
        operation: 'update',
        wallet_address: user.wallet_address,
        nickname: profile.nickname,
        avatar: profile.avatar
      })

      if (response.api_code == 200) {
        // 更新本地用户信息
        // 这里可能需要刷新用户认证状态或重新获取用户信息
        window.location.reload() // 简单的刷新页面方式
      } else {
        throw new Error(response.api_msg || '更新失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      throw error
    }
  }

  // 提现功能
  const handleWithdraw = async () => {
    if (!user) {
      showError('提现失败', '用户信息不存在')
      return
    }

    // 检查是否有钱包地址
    if (!user.wallet_address) {
      showWarning('提现失败', '请先绑定钱包')
      return
    }

    // 检查是否有可提现金额
    if (inviteStats.total_reward <= 0) {
      showWarning('提现失败', '没有可提现的金额')
      return
    }

    setWithdrawLoading(true)
    try {
      const response = await publicAPI.post('/v1/users/withdraw', {})
      
      if (response.api_code == 200) {
        showSuccess('提现申请成功', '您的提现申请已提交，请等待处理')
        // 刷新未提现金额
        await loadUserData()
      } else {
        showError('提现申请失败', response.api_msg || '请稍后重试')
      }
    } catch (error) {
      console.error('提现申请失败:', error)
      showError('提现申请失败', '网络错误，请稍后重试')
    } finally {
      setWithdrawLoading(false)
    }
  }

  // 重新加载用户数据的函数
  const loadUserData = async () => {
    if (!isClient || !isAuthenticated) return
    
    setLoading(true)
    try {
      // 并行加载基础数据
      const [
        researchStatsRes,
        airdropRecordsRes,
        airdropStatsRes,
        airdropActivityStatsRes,
        unionInfoRes,
        profileRes,
        inviteLinkRes
      ] = await Promise.all([
        userDataAPI.getResearchStats(),
        userDataAPI.getAirdropRecords(),
        userDataAPI.getAirdropStats(),
        userDataAPI.getAirdropActivityStats(),
        userDataAPI.getUnionInfo(unionPage, unionLimit),
        userProfileAPI.getUserProfile(),
        userDataAPI.generateInviteLink()
      ])
      
      // 加载投研活动数据
      await loadResearchActivities()
      
      // 加载空投活动数据
      await loadAirdropActivities()
      
      // 设置投研统计数据
      if (researchStatsRes.api_code == 200 && researchStatsRes.data) {
        setResearchStats(researchStatsRes.data)
      }
      
      // 设置空投记录数据
      if (airdropRecordsRes.api_code == 200 && airdropRecordsRes.data) {
        setAirdropRecords(airdropRecordsRes.data.records)
      }
      
      // 设置空投统计数据
      if (airdropStatsRes.api_code == 200 && airdropStatsRes.data) {
        setAirdropStats(airdropStatsRes.data)
      }
      
      // 设置空投活动统计数据
      if (airdropActivityStatsRes.api_code == 200 && airdropActivityStatsRes.data) {
        setAirdropActivityStats(airdropActivityStatsRes.data)
      }
      
      // 设置邀请（联盟）数据与统计
      if (unionInfoRes.api_code == 200 && unionInfoRes.data) {
        setUnionInfo(unionInfoRes.data)
        setUnionTotalPages((unionInfoRes.data as any).total_pages || 1)
        const total = unionInfoRes.data.people_num || 0
        const paid = unionInfoRes.data.people_vip_num || 0
        setInviteStats(prev => ({ ...prev, total, paid }))
      }

      // 使用用户资料中的 balance 作为未提现金额
      if (profileRes.api_code == 200 && profileRes.data) {
        const balance = Number((profileRes.data as any).balance || 0)
        setInviteStats(prev => ({ ...prev, total_reward: isNaN(balance) ? 0 : balance }))
      }
      
      // 设置邀请链接
      if (inviteLinkRes.api_code == 200 && inviteLinkRes.data) {
        setInviteLink(inviteLinkRes.data.invite_link)
      }
      
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = () => {
    // 这里应该使用真实的二维码生成库，比如 qrcode.js
    // 现在用占位图片代替
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`
  }

  // 获取投研活动列表（已从后端过滤）
  const getFilteredResearchActivities = () => {
    if (!isClient) return []
    return researchActivities
  }

  // 获取空投活动列表（已从后端过滤）
  const getFilteredAirdropActivities = () => {
    if (!isClient) return []
    return airdropActivities
  }

  // 获取各类投研活动的统计数量
  const getResearchStatsCount = () => {
    return researchStats
  }

  // 获取各类空投活动的统计数量
  const getAirdropActivityStatsCount = () => {
    return airdropActivityStats
  }

  // 避免水合错误，在客户端挂载前显示加载状态
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          <p className="text-text-secondary mt-2">加载中...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-text-primary mb-2">请先登录</h2>
          <p className="text-text-secondary">登录后查看您的个人数据</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <User className="h-12 w-12 text-pink-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
              个人中心
            </h1>
          </div>
          <div className="bg-background-card rounded-xl p-6 border border-gray-700 max-w-md mx-auto relative">
            {/* 编辑资料按钮 - 右上角 */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="absolute top-4 right-4 text-gray-400 hover:text-pink-400 transition-colors"
              title="编辑资料"
            >
              <Settings className="h-5 w-5" />
            </button>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 overflow-hidden relative">
                {user.avatar && !avatarError ? (
                  <img 
                    src={user.avatar} 
                    alt="用户头像" 
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div className="w-16 h-16 bg-pink-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {user.nickname?.slice(0, 2).toUpperCase() || user.wallet_address?.slice(2, 4).toUpperCase() || 'U'}
                  </div>
                )}
              </div>
              <div className="text-text-primary font-medium mb-2">
                {user.nickname || `${user.wallet_address?.slice(0, 6)}...${user.wallet_address?.slice(-4)}`}
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  {isVipMember ? (
                    <>
                     
                      <div className="relative group">
                        <Image 
                          src="/vip-pass.png" 
                          alt="年费会员" 
                          width={28} 
                          height={28}
                          className="cursor-help"
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                          VIP会员专属标识
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                      {isTradeMember && (
                        <div className="relative group">
                          <Image 
                            src="/vip-trade.png" 
                            alt="交易会员" 
                            width={28} 
                            height={28}
                            className="cursor-help"
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            VIP交易会员专属标识
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                      {isAmbassador && (
                        <div className="relative group">
                          <Image 
                            src="/necktie.png" 
                            alt="LULALA大使" 
                            width={28} 
                            height={28}
                            className="cursor-help"
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            LULALA大使专属标识
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <User className="h-4 w-4 text-gray-400" />
                      {isTradeMember && (
                        <div className="relative group">
                          <Image 
                            src="/vip-trade.png" 
                            alt="交易会员" 
                            width={28} 
                            height={28}
                            className="cursor-help"
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            VIP交易会员专属标识
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                      {isAmbassador && (
                        <div className="relative group">
                          <Image 
                            src="/necktie.png" 
                            alt="LULALA大使" 
                            width={28} 
                            height={28}
                            className="cursor-help"
                          />
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            LULALA大使专属标识
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {!isVipMember && (
                  <Link
                    href="/subscription"
                    className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
                  >
                    <Image 
                      src="/vip-pass.png" 
                      alt="升级会员" 
                      width={16} 
                      height={16}
                    />
                    <span>升级会员</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="flex justify-center mb-8">
          <div className="bg-background-card rounded-xl p-2 border border-gray-700">
            <div className="flex space-x-2">
              {[
                { key: 'research', label: '投研', icon: Star },
                { key: 'airdrops', label: '空投', icon: Gift },
                ...(user.usertype == 1 ? [{ key: 'invite', label: '邀请', icon: Users }] : [])
              ].map(({ key, label, icon: Icon }) => {
                const getTabColors = (tabKey: string) => {
                  switch (tabKey) {
                    case 'research':
                      return {
                        active: 'bg-blue-400 text-white shadow-lg shadow-blue-400/25',
                        inactive: 'text-text-secondary hover:text-blue-400 hover:bg-blue-400/10'
                      }
                    case 'airdrops':
                      return {
                        active: 'bg-purple-400 text-white shadow-lg shadow-purple-400/25',
                        inactive: 'text-text-secondary hover:text-purple-400 hover:bg-purple-400/10'
                      }
                    case 'invite':
                      return {
                        active: 'bg-green-400 text-white shadow-lg shadow-green-400/25',
                        inactive: 'text-text-secondary hover:text-green-400 hover:bg-green-400/10'
                      }
                    default:
                      return {
                        active: 'bg-pink-400 text-white shadow-lg shadow-pink-400/25',
                        inactive: 'text-text-secondary hover:text-pink-400 hover:bg-pink-400/10'
                      }
                  }
                }
                
                const colors = getTabColors(key)
                
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key as any)
                      setTabAnimationKey(prev => prev + 1)
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab == key ? colors.active : colors.inactive
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="space-y-6">
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
              <p className="text-text-secondary mt-2">加载数据中...</p>
            </div>
          )}
          {/* 投研记录 */}
          {activeTab == 'research' && (
            <div key={`research-${tabAnimationKey}`} className="space-y-6 animate-fade-in-right">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">投研项目记录</h3>
                </div>
                <div className="text-sm text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                  专业分析
                </div>
              </div>

              {/* 投研记录统计 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'participate', label: '参与', icon: User, color: 'blue' },
                  { key: 'like', label: '点赞', icon: Heart, color: 'pink' },
                  { key: 'bookmark', label: '收藏', icon: Bookmark, color: 'yellow' }
                ].map(({ key, label, icon: Icon, color }) => {
                  const stats = getResearchStatsCount()
                  const count = stats[key as keyof typeof stats]
                  const isActive = researchSubTab == key
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setResearchSubTab(key as any)}
                      className={`bg-background-card rounded-xl p-4 border transition-all ${
                        isActive 
                          ? 'ring-2 ring-blue-400 border-blue-400 bg-blue-400/5' 
                          : 'border-gray-700 hover:border-blue-400/50 hover:bg-blue-400/5'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                          color == 'blue' ? 'bg-blue-400/10' :
                          color == 'pink' ? 'bg-pink-400/10' :
                          'bg-yellow-400/10'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            color == 'blue' ? 'text-blue-400' :
                            color == 'pink' ? 'text-pink-400' :
                            'text-yellow-400'
                          }`} />
                        </div>
                        <div className="text-2xl font-bold text-text-primary mb-1">{count}</div>
                        <div className="text-sm text-text-secondary">{label}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 投研记录列表 */}
              <div className="space-y-4">
                {getFilteredResearchActivities().map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="bg-background-card rounded-xl p-6 border border-gray-700 hover:border-blue-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-400/10 card-hover"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getActionIcon(activity.action)}
                          <span className="text-text-secondary text-sm">
                            {getActionText(activity.action)}
                          </span>
                          <span className="text-text-muted text-xs flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.timestamp}
                          </span>
                        </div>
                        <h4 className="text-text-primary font-medium mb-2">{activity.reportTitle}</h4>
                        {activity.content && (
                          <p className="text-text-secondary text-sm bg-background border border-gray-700 rounded-lg p-3">
                            {activity.content}
                          </p>
                        )}
                      </div>
                      <Link 
                        href={`/research?id=${activity.reportId}`} 
                        className="text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-blue-400/10"
                        title="查看报告详情"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
                
                {getFilteredResearchActivities().length == 0 && (
                  <div className="text-center py-12 text-text-muted">
                    <div className="mb-4">
                      {researchSubTab == 'participate' && <User className="h-12 w-12 mx-auto text-blue-400/50" />}
                      {researchSubTab == 'like' && <Heart className="h-12 w-12 mx-auto text-pink-400/50" />}
                      {researchSubTab == 'bookmark' && <Bookmark className="h-12 w-12 mx-auto text-yellow-400/50" />}
                    </div>
                    <p>
                      暂无{researchSubTab == 'participate' ? '参与' : researchSubTab == 'like' ? '点赞' : '收藏'}记录
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 空投记录 */}
          {activeTab == 'airdrops' && (
            <div key={`airdrops-${tabAnimationKey}`} className="space-y-6 animate-fade-in-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Gift className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary">空投项目记录</h3>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-purple-400 bg-purple-400/10 px-3 py-1 rounded-full">
                    免费福利
                  </div>
                  {!isVipMember && (
                    <Link
                      href="/subscription"
                      className="text-pink-400 hover:text-pink-300 text-sm flex items-center space-x-1 transition-colors"
                    >
                      <Crown className="h-4 w-4" />
                      <span>会员专享空投</span>
                    </Link>
                  )}
                </div>
              </div>

              {/* 空投记录统计 */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { key: 'participate', label: '参与', icon: User, color: 'blue' },
                  { key: 'like', label: '点赞', icon: Heart, color: 'pink' },
                  { key: 'bookmark', label: '收藏', icon: Bookmark, color: 'yellow' }
                ].map(({ key, label, icon: Icon, color }) => {
                  const stats = getAirdropActivityStatsCount()
                  const count = stats[key as keyof typeof stats]
                  const isActive = airdropSubTab == key
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setAirdropSubTab(key as any)}
                      className={`bg-background-card rounded-xl p-4 border transition-all ${
                        isActive 
                          ? 'ring-2 ring-purple-400 border-purple-400 bg-purple-400/5' 
                          : 'border-gray-700 hover:border-purple-400/50 hover:bg-purple-400/5'
                      }`}
                    >
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 ${
                          color == 'blue' ? 'bg-blue-400/10' :
                          color == 'pink' ? 'bg-pink-400/10' :
                          'bg-yellow-400/10'
                        }`}>
                          <Icon className={`h-6 w-6 ${
                            color == 'blue' ? 'text-blue-400' :
                            color == 'pink' ? 'text-pink-400' :
                            'text-yellow-400'
                          }`} />
                        </div>
                        <div className="text-2xl font-bold text-text-primary mb-1">{count}</div>
                        <div className="text-sm text-text-secondary">{label}</div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* 空投记录列表 */}
              <div className="space-y-4">
                {getFilteredAirdropActivities().map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="bg-background-card rounded-xl p-6 border border-gray-700 hover:border-purple-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-400/10 card-hover"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getActionIcon(activity.action)}
                          <span className="text-text-secondary text-sm">
                            {getActionText(activity.action)}
                          </span>
                          <span className="text-text-muted text-xs flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {activity.timestamp}
                          </span>
                          {activity.status && getStatusBadge(activity.status)}
                        </div>
                        <h4 className="text-text-primary font-medium mb-2">{activity.airdropTitle}</h4>
                        {activity.content && (
                          <p className="text-text-secondary text-sm bg-background border border-gray-700 rounded-lg p-3">
                            {activity.content}
                          </p>
                        )}
                      </div>
                      <button className="text-purple-400 hover:text-purple-300 transition-colors p-2 rounded-lg hover:bg-purple-400/10">
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {getFilteredAirdropActivities().length == 0 && (
                  <div className="text-center py-12 text-text-muted">
                    <div className="mb-4">
                      {airdropSubTab == 'participate' && <User className="h-12 w-12 mx-auto text-blue-400/50" />}
                      {airdropSubTab == 'like' && <Heart className="h-12 w-12 mx-auto text-pink-400/50" />}
                      {airdropSubTab == 'bookmark' && <Bookmark className="h-12 w-12 mx-auto text-yellow-400/50" />}
                    </div>
                    <p>
                      暂无{airdropSubTab == 'participate' ? '参与' : airdropSubTab == 'like' ? '点赞' : '收藏'}记录
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 邀请记录 */}
          {activeTab == 'invite' && (
            <div key={`invite-${tabAnimationKey}`} className="space-y-6 animate-fade-in-up">
              {/* 邀请功能 */}
              <div className="bg-background-card rounded-xl p-6 border border-gray-700 hover:border-green-400/50 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <QrCode className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary">邀请好友</h3>
                  </div>
                  <div className="text-sm text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                    赚取佣金
                  </div>
                </div>
                <p className="text-text-secondary mb-6">
                  邀请好友注册并付费成为会员，您将获得 {user.invite_reward} USDT 奖励
                </p>
                
                <div className="space-y-4">
                  <div className="bg-background border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-text-primary font-mono text-sm break-all mr-4">
                        {inviteLink}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                          copySuccess 
                            ? 'bg-green-500 text-white' 
                            : 'bg-pink-400 hover:bg-pink-500 text-white'
                        }`}
                      >
                        <Copy className="h-4 w-4" />
                        <span>{copySuccess ? '已复制!' : '复制链接'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* 显示邀请码 */}
                  {showInviteCode && (
                    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-text-muted mb-1">您的邀请码</div>
                          <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-mono">
                            {getInviteCode()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setShowQRModal(true)}
                      className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                    >
                      <QrCode className="h-5 w-5" />
                      <span className="hidden sm:inline">生成二维码</span>
                      <span className="sm:hidden">二维码</span>
                    </button>
                    
                    <button
                      onClick={() => setShowInviteCode(!showInviteCode)}
                      className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-5 w-5" />
                      <span className="hidden sm:inline">{showInviteCode ? '隐藏' : '显示'}邀请码</span>
                      <span className="sm:hidden">{showInviteCode ? '隐藏' : '显示'}</span>
                    </button>
                    
                    <button
                      onClick={handleCopyCode}
                      className={`py-3 px-4 rounded-lg font-medium transition-all flex items-center justify-center space-x-2 ${
                        copyCodeSuccess 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
                      }`}
                    >
                      <Copy className="h-5 w-5" />
                      <span className="hidden sm:inline">{copyCodeSuccess ? '已复制!' : '复制邀请码'}</span>
                      <span className="sm:hidden">{copyCodeSuccess ? '已复制!' : '复制码'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 邀请统计 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background-card rounded-xl p-6 border border-gray-700 text-center">
                  {user?.usertype == 1 ? (
                    <>
                      <div className="text-2xl font-bold text-pink-400 mb-1">
                        {inviteStats.total}
                      </div>
                      <div className="text-sm text-text-muted mb-2">直邀人数</div>
                      <div className="text-2xl font-bold text-blue-400 mb-1">
                        {unionInfo?.tree_people_num || 0}
                      </div>
                      <div className="text-text-secondary">邀请总数</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-pink-400 mb-2">
                        {inviteStats.total}
                      </div>
                      <div className="text-text-secondary">直邀人数</div>
                    </>
                  )}
                </div>
                <div className="bg-background-card rounded-xl p-6 border border-gray-700 text-center">
                  {user?.usertype == 1 ? (
                    <>
                      <div className="text-2xl font-bold text-green-400 mb-1">
                        {inviteStats.paid}
                      </div>
                      <div className="text-sm text-text-muted mb-2">直邀VIP</div>
                      <div className="text-2xl font-bold text-purple-400 mb-1">
                        {unionInfo?.tree_people_vip_num || 0}
                      </div>
                      <div className="text-text-secondary">VIP总数</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-400 mb-2">
                        {inviteStats.paid}
                      </div>
                      <div className="text-text-secondary">VIP会员</div>
                    </>
                  )}
                </div>
                <div className="bg-background-card rounded-xl p-6 border border-gray-700 text-center">
                  <div className="text-2xl font-bold text-yellow-400 mb-2">
                    {inviteStats.total_reward} USDT
                  </div>
                  <div className="text-text-secondary mb-3">邀请佣金（未提现）</div>
                  <button
                    onClick={handleWithdraw}
                    disabled={withdrawLoading || inviteStats.total_reward <= 0}
                    className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      withdrawLoading || inviteStats.total_reward <= 0
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-yellow-400 hover:bg-yellow-500 text-black'
                    }`}
                  >
                    <Wallet className="h-4 w-4" />
                    <span>{withdrawLoading ? '处理中...' : '提现'}</span>
                  </button>
                </div>
              </div>

              {/* 邀请记录列表 */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-text-primary">邀请记录</h4>
                {unionInfo && unionInfo.people_list && unionInfo.people_list.length > 0 ? unionInfo.people_list.map((person) => (
                  <div key={person.userid} className="bg-background-card rounded-xl p-6 border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {person.avatar ? (
                            <img src={person.avatar} alt="头像" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {String(person.userid).slice(-2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="text-text-primary font-medium">
                              {person.nickname || `用户 #${person.userid}`}
                            </div>
                            <div className="text-sm text-text-muted">
                              会员状态: {person.viplevel && person.viplevel > 0 ? '已付费' : '未付费'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {person.viplevel && person.viplevel > 0 ? (
                          <div>
                            <div className="text-green-400 font-semibold mb-1">
                              已付费
                            </div>
                            
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            未付费
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-text-muted">
                    <Users className="h-12 w-12 mx-auto text-gray-400/50 mb-4" />
                    <p>暂无邀请记录</p>
                  </div>
                )}
                {/* 分页控件 */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={unionPage <= 1}
                    onClick={() => setUnionPage(p => Math.max(1, p - 1))}
                    className={`px-3 py-2 rounded-lg border ${unionPage <= 1 ? 'text-gray-500 border-gray-700 cursor-not-allowed' : 'text-text-primary border-gray-700 hover:border-pink-400'}`}
                  >上一页</button>
                  <div className="text-text-secondary text-sm">第 {unionPage} / {unionTotalPages} 页</div>
                  <button
                    disabled={unionPage >= unionTotalPages}
                    onClick={() => setUnionPage(p => Math.min(unionTotalPages, p + 1))}
                    className={`px-3 py-2 rounded-lg border ${unionPage >= unionTotalPages ? 'text-gray-500 border-gray-700 cursor-not-allowed' : 'text-text-primary border-gray-700 hover:border-pink-400'}`}
                  >下一页</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 二维码弹窗 */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-4">专属邀请二维码</h3>
              
              <div className="bg-white rounded-lg p-4 mb-6 inline-block">
                <img
                  src={generateQRCode()}
                  alt="邀请二维码"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              
              <p className="text-text-secondary text-sm mb-6">
                扫描二维码或分享链接邀请好友注册
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    copySuccess 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  <Copy className="h-4 w-4" />
                  <span>{copySuccess ? '已复制!' : '复制链接'}</span>
                </button>
                
                <button
                  onClick={() => {
                    // 这里可以实现下载二维码功能
                    if (isClient && typeof window !== 'undefined') {
                      const link = document.createElement('a')
                      link.href = generateQRCode()
                      link.download = 'invite-qrcode.png'
                      link.click()
                    }
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 bg-pink-400 hover:bg-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>下载</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full mt-4 text-text-muted hover:text-text-primary transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 用户资料编辑模态框 */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={handleSaveProfile}
        initialProfile={{
          nickname: user.nickname || '',
          avatar: user.avatar || ''
        }}
      />

      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  )
}
