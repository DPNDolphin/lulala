'use client'

import { useState, useEffect, useRef } from 'react'
import { User, Heart, MessageCircle, Trophy, Gift, History, Settings, Wallet, Crown, ChevronDown, ChevronUp, Users, QrCode, Copy, Download, Eye, BarChart3, MoreHorizontal, Bookmark, Clock, ExternalLink } from 'lucide-react'
import * as d3 from 'd3'
import Link from 'next/link'
import Image from 'next/image'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { userProfileAPI, pointLogAPI, PointLog, UserProfileData, userDataAPI, UnionInfoResponse, publicAPI } from '@/lib/publicAPI'
import UserProfileModal from '@/components/UserProfileModal'
import { useToast } from '@/components/Toast'

export default function ProfilePage() {
  const { isAuthenticated, user } = useMultiAuth()
  const { showSuccess, showError, showWarning, ToastContainer } = useToast()
  
  // 用户资料数据
  const [profileData, setProfileData] = useState<UserProfileData | null>(null)
  const [currentPoint, setCurrentPoint] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [avatarError, setAvatarError] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // 积分统计数据
  const [pointStats, setPointStats] = useState<any>(null)
  const [statsDays, setStatsDays] = useState(7)
  const [statsLoading, setStatsLoading] = useState(false)
  const chartRef = useRef<HTMLDivElement>(null)
  
  // 积分日志数据
  const [pointLogs, setPointLogs] = useState<PointLog[]>([])
  const [pointPage, setPointPage] = useState(1)
  const [pointTotalPages, setPointTotalPages] = useState(1)
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null)
  
  // 详细列表弹窗状态
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailType, setDetailType] = useState<'likes' | 'comments' | 'projects' | null>(null)
  const [detailData, setDetailData] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  
  // 邀请记录展开状态
  const [inviteRecordsExpanded, setInviteRecordsExpanded] = useState(false)
  
  // 我的互动相关状态
  const [interactionTab, setInteractionTab] = useState<'like' | 'comment' | 'participate'>('like')
  const [researchActivities, setResearchActivities] = useState<any[]>([])
  const [airdropActivities, setAirdropActivities] = useState<any[]>([])
  const [researchStats, setResearchStats] = useState<any>({ participate: 0, like: 0, bookmark: 0 })
  const [airdropActivityStats, setAirdropActivityStats] = useState<any>({ participate: 0, like: 0, bookmark: 0 })

  // VIP 状态
  const [isVipMember, setIsVipMember] = useState(false)
  const [isTradeMember, setIsTradeMember] = useState(false)
  const [isAmbassador, setIsAmbassador] = useState(false)

  // 邀请数据
  const [unionInfo, setUnionInfo] = useState<UnionInfoResponse | null>(null)
  const [unionPage, setUnionPage] = useState(1)
  const [unionLimit] = useState(10)
  const [unionTotalPages, setUnionTotalPages] = useState(1)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteStats, setInviteStats] = useState({ total: 0, paid: 0, total_reward: 0 })
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyCodeSuccess, setCopyCodeSuccess] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showInviteCode, setShowInviteCode] = useState(false)
  const [withdrawLoading, setWithdrawLoading] = useState(false)
  
  // 设置交易VIP相关状态
  const [grantingTradeVip, setGrantingTradeVip] = useState<number | null>(null)
  const [showTradeVipModal, setShowTradeVipModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)

  // 客户端挂载标识
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 从用户数据获取会员状态
  useEffect(() => {
    if (isClient && isAuthenticated && user) {
      console.log('用户信息:', user)
      console.log('用户类型:', user.usertype)
      setIsVipMember(((user?.vip_level) ?? 0) > 0)
      setIsTradeMember(((user?.trade_level) ?? 0) > 0)
      setIsAmbassador((user?.usertype ?? 0) == 1)
      setAvatarError(false)
    } else {
      setIsTradeMember(false)
      setIsVipMember(false)
      setIsAmbassador(false)
    }
  }, [isClient, isAuthenticated, user])

  // 加载用户数据
  useEffect(() => {
    loadUserData()
  }, [isClient, isAuthenticated, unionPage])

  // 加载积分统计数据
  useEffect(() => {
    if (isClient && isAuthenticated) {
      loadPointStats()
    }
  }, [isClient, isAuthenticated, statsDays])

  // 加载积分日志
  useEffect(() => {
    if (isClient && isAuthenticated) {
      loadPointLogs()
    }
  }, [isClient, isAuthenticated, pointPage])

  // 加载互动数据
  useEffect(() => {
    if (isClient && isAuthenticated) {
      loadInteractionData()
    }
  }, [isClient, isAuthenticated, interactionTab])

  const loadUserData = async () => {
    if (!isClient || !isAuthenticated) return
    
    setLoading(true)
    try {
      // 先加载用户资料
      const profileRes = await userProfileAPI.getUserProfile()
      
      // 设置用户资料
      if (profileRes.api_code == 200 && profileRes.data) {
        setProfileData(profileRes.data)
        setCurrentPoint(profileRes.data.point || 0)
        
        // 使用用户资料中的 balance 作为未提现金额
        const balance = Number((profileRes.data as any).balance || 0)
        setInviteStats(prev => ({ ...prev, total_reward: isNaN(balance) ? 0 : balance }))
      }

      // 如果是大使，加载邀请数据
      console.log('检查用户类型:', user?.usertype, '是否等于1:', user?.usertype == 1)
      if (user?.usertype == 1) {
        console.log('开始加载邀请数据...')
        const [unionInfoRes, inviteLinkRes] = await Promise.all([
          userDataAPI.getUnionInfo(unionPage, unionLimit),
          userDataAPI.generateInviteLink()
        ])

        console.log('联盟信息响应:', unionInfoRes)
        console.log('邀请链接响应:', inviteLinkRes)

        if (unionInfoRes && unionInfoRes.api_code == 200 && unionInfoRes.data) {
          setUnionInfo(unionInfoRes.data)
          setUnionTotalPages((unionInfoRes.data as any).total_pages || 1)
          const total = unionInfoRes.data.people_num || 0
          const paid = unionInfoRes.data.people_vip_num || 0
          setInviteStats(prev => ({ ...prev, total, paid }))
          console.log('设置邀请统计:', { total, paid })
        }

        if (inviteLinkRes && inviteLinkRes.api_code == 200 && inviteLinkRes.data) {
          setInviteLink(inviteLinkRes.data.invite_link)
          console.log('设置邀请链接:', inviteLinkRes.data.invite_link)
        }
      } else {
        console.log('用户不是大使，跳过邀请数据加载')
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPointStats = async () => {
    if (!isClient || !isAuthenticated) return
    
    setStatsLoading(true)
    try {
      const response = await publicAPI.get(`/v1/users/pointStats?days=${statsDays}`)
      if (response.api_code == 200 && response.data) {
        setPointStats(response.data)
        setCurrentPoint(response.data.current_point)
      }
    } catch (error) {
      console.error('加载积分统计失败:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const loadPointLogs = async () => {
    if (!isClient || !isAuthenticated) return
    
    try {
      const response = await pointLogAPI.getPointLogs(pointPage, 5) // 只显示5条
      if (response.api_code == 200 && response.data) {
        setPointLogs(response.data.logs)
        setPointTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      console.error('加载积分日志失败:', error)
    }
  }

  const loadInteractionData = async () => {
    if (!isClient || !isAuthenticated) return
    
    try {
      // 加载投研活动数据
      const researchResponse = await userDataAPI.getResearchActivities(interactionTab, 1, 10)
      if (researchResponse.api_code == 200 && researchResponse.data) {
        setResearchActivities(researchResponse.data.activities || [])
      }

      // 加载空投活动数据
      const airdropResponse = await userDataAPI.getAirdropActivities(interactionTab, 1, 10)
      if (airdropResponse.api_code == 200 && airdropResponse.data) {
        setAirdropActivities(airdropResponse.data.activities || [])
      }

      // 加载统计数据
      const [researchStatsRes, airdropStatsRes] = await Promise.all([
        userDataAPI.getResearchStats(),
        userDataAPI.getAirdropActivityStats()
      ])

      if (researchStatsRes.api_code == 200 && researchStatsRes.data) {
        setResearchStats(researchStatsRes.data)
      }

      if (airdropStatsRes.api_code == 200 && airdropStatsRes.data) {
        setAirdropActivityStats(airdropStatsRes.data)
      }
    } catch (error) {
      console.error('加载互动数据失败:', error)
    }
  }

  // 补齐缺失的日期数据
  const fillMissingDates = (dailyData: any[], days: number) => {
    const result = []
    const today = new Date()
    
    // 创建日期到数据的映射
    const dataMap = new Map()
    dailyData.forEach(item => {
      dataMap.set(item.date, item)
    })
    
    // 补齐最近N天的数据
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      if (dataMap.has(dateStr)) {
        result.push(dataMap.get(dateStr))
      } else {
        // 补齐缺失的日期，积分为0
        result.push({
          date: dateStr,
          count: 0,
          daily_change: 0,
          daily_earned: 0,
          daily_spent: 0
        })
      }
    }
    
    return result
  }

  // 绘制D3曲线图
  const drawChart = () => {
    if (!chartRef.current || !pointStats || !pointStats.daily_breakdown) return

    // 清除之前的图表
    d3.select(chartRef.current).selectAll("*").remove()

    // 补齐缺失的日期数据
    const data = fillMissingDates(pointStats.daily_breakdown, statsDays)
    if (data.length == 0) return

    const container = chartRef.current
    const width = container.offsetWidth
    const height = container.offsetHeight || 200
    const margin = { top: 20, right: 30, bottom: 40, left: 50 }

    // 创建SVG
    const svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)

    // 创建缩放
    const xScale = d3.scaleTime()
      .domain(d3.extent(data, (d: any) => new Date(d.date)) as [Date, Date])
      .range([margin.left, width - margin.right])

    const yValues = data.map((d: any) => d.daily_change)
    const yExtent = d3.extent(yValues)
    const yScale = d3.scaleLinear()
      .domain(yExtent[0] !== undefined && yExtent[1] !== undefined ? yExtent as [number, number] : [0, 0])
      .range([height - margin.bottom, margin.top])

    // 创建平滑曲线生成器
    const line = d3.line<{date: string, daily_change: number}>()
      .x((d: any) => xScale(new Date(d.date)))
      .y((d: any) => yScale(d.daily_change))
      .curve(d3.curveCardinal.tension(0.5)) // 使用Cardinal曲线，tension控制平滑度


    // 绘制曲线
    svg.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "#aeb9e1")
      .attr("stroke-width", 2)
      .attr("d", line)

    // 绘制数据点
    svg.selectAll(".dot")
      .data(data)
      .enter().append("circle")
      .attr("class", "dot")
      .attr("cx", (d: any) => xScale(new Date(d.date)))
      .attr("cy", (d: any) => yScale(d.daily_change))
      .attr("r", 4)
      .attr("fill", (d: any) => d.daily_change > 0 ? "#10b981" : "#ef4444")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .on("mouseover", function(event, d: any) {
        // 显示tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "#0b1739")
          .style("border", "1px solid #2d354c")
          .style("border-radius", "4px")
          .style("padding", "8px")
          .style("color", "#aeb9e1")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000")
          .html(`
            <div>${new Date(d.date).toLocaleDateString()}</div>
            <div>${d.daily_change > 0 ? '+' : ''}${d.daily_change} 积分</div>
          `)

        d3.select(this).attr("r", 6)
      })
      .on("mousemove", function(event) {
        d3.select(".tooltip")
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px")
      })
      .on("mouseout", function() {
        d3.select(".tooltip").remove()
        d3.select(this).attr("r", 4)
      })

    // 添加X轴
    const xAxis = d3.axisBottom(xScale)
      .tickFormat((d: any) => d3.timeFormat("%m/%d")(d as Date))
      .ticks(Math.min(data.length, 10)) // 最多显示10个刻度

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .style("color", "#aeb9e1")
      .style("font-size", "12px")
      .call(xAxis)

    // 添加Y轴
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format("d"))

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .style("color", "#aeb9e1")
      .style("font-size", "12px")
      .call(yAxis)
  }

  // 当数据更新时重新绘制图表
  useEffect(() => {
    if (pointStats && !statsLoading) {
      setTimeout(drawChart, 100) // 延迟确保DOM更新
    }
  }, [pointStats, statsLoading])

  const getPointChangeColor = (change: number) => {
    if (change > 0) return 'text-green-400'
    if (change < 0) return 'text-red-400'
    return 'text-gray-400'
  }

  const getPointChangeIcon = (change: number) => {
    if (change > 0) return '+'
    return ''
  }

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

  // 加载详细数据
  const loadDetailData = async (type: 'likes' | 'comments' | 'projects') => {
    setDetailLoading(true)
    setDetailType(type)
    setShowDetailModal(true)
    
    try {
      // 这里应该调用相应的API获取详细数据
      // 暂时使用模拟数据
      const mockData = {
        likes: [
          { id: 1, name: 'Bitcoin空投项目', type: 'airdrop', date: '2025-01-12' },
          { id: 2, name: 'Ethereum生态项目', type: 'airdrop', date: '2025-01-11' },
        ],
        comments: [
          { id: 1, name: 'Solana空投活动', type: 'airdrop', date: '2025-01-12' },
          { id: 2, name: 'Polygon生态项目', type: 'airdrop', date: '2025-01-10' },
        ],
        projects: [
          { id: 1, name: 'Avalanche空投', type: 'airdrop', date: '2025-01-12' },
          { id: 2, name: 'Chainlink生态', type: 'airdrop', date: '2025-01-09' },
        ]
      }
      
      setDetailData(mockData[type] || [])
    } catch (error) {
      console.error('加载详细数据失败:', error)
      setDetailData([])
    } finally {
      setDetailLoading(false)
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
        showSuccess('更新成功', '您的个人资料已更新')
        window.location.reload()
      } else {
        throw new Error(response.api_msg || '更新失败')
      }
    } catch (error) {
      console.error('保存用户信息失败:', error)
      throw error
    }
  }

  // 邀请相关函数
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

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

  const generateQRCode = () => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}`
  }

  const handleWithdraw = async () => {
    if (!user) {
      showError('提现失败', '用户信息不存在')
      return
    }

    if (!user.wallet_address) {
      showWarning('提现失败', '请先绑定钱包')
      return
    }

    if (inviteStats.total_reward <= 0) {
      showWarning('提现失败', '没有可提现的金额')
      return
    }

    setWithdrawLoading(true)
    try {
      const response = await publicAPI.post('/v1/users/withdraw', {})
      
      if (response.api_code == 200) {
        showSuccess('提现申请成功', '您的提现申请已提交，请等待处理')
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

  // 设置交易VIP
  const handleGrantTradeVip = async (targetUserId: number, tradeDays: number = 365) => {
    setGrantingTradeVip(targetUserId)
    try {
      const response = await userDataAPI.grantTradeVip(targetUserId, tradeDays)
      
      if (response.api_code == 200) {
        showSuccess('设置成功', '已为该用户设置交易VIP')
        await loadUserData() // 重新加载数据
      } else {
        showError('设置失败', response.api_msg || '请稍后重试')
      }
    } catch (error) {
      console.error('设置交易VIP失败:', error)
      showError('设置失败', '网络错误，请稍后重试')
    } finally {
      setGrantingTradeVip(null)
    }
  }

  // 打开设置交易VIP模态框
  const openTradeVipModal = (person: any) => {
    setSelectedUser(person)
    setShowTradeVipModal(true)
  }


  // 避免水合错误
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
      <div className="max-w-7xl mx-auto">
        {/* Dashboard Header */}
        {loading && !profileData ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
            <p className="text-text-secondary mt-2">加载数据中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 用户信息卡片 */}
            <div className="p-2">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                <div className="flex items-center space-x-2">
                  {/* 头像 */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-pink-400/30">
                      {user.avatar && !avatarError ? (
                        <img 
                          src={user.avatar} 
                          alt="用户头像" 
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-lg font-bold">
                          {user.nickname?.slice(0, 2).toUpperCase() || user.wallet_address?.slice(2, 4).toUpperCase() || 'U'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 用户信息 */}
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h2 className="text-lg font-bold text-text-primary">
                        {user.nickname || `${user.wallet_address?.slice(0, 6)}...${user.wallet_address?.slice(-4)}`}
                      </h2>
                      {isVipMember && (
                        <Image src="/vip-pass.png" alt="VIP" width={24} height={24} />
                      )}
                      {isTradeMember && (
                        <Image src="/vip-trade.png" alt="交易会员" width={24} height={24} />
                      )}
                      {isAmbassador && (
                        <Image src="/necktie.png" alt="大使" width={24} height={24} />
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <div className="flex items-center space-x-1">
                        <Wallet className="h-4 w-4" />
                        <span className="font-mono">
                          {user.wallet_address?.slice(0, 6)}...{user.wallet_address?.slice(-4)}
                        </span>
                      </div>
                      {user.email && (
                        <div className="flex items-center space-x-1">
                          <span>·</span>
                          <span>{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex items-center space-x-2">
                  {!isVipMember && (
                    <Link
                      href="/subscription"
                      className="flex items-center space-x-1 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    >
                      <Crown className="h-4 w-4" />
                      <span>升级会员</span>
                    </Link>
                  )}
                  <button
                    onClick={() => setShowProfileModal(true)}
                    className="flex items-center space-x-1 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  >
                    <Settings className="h-4 w-4" />
                    <span>编辑资料</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 统计卡片区域 */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* 积分卡片 */}
              <div className="rounded-lg px-4 py-3 border transition-all" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
                <div className="flex items-center space-x-3 mb-3">
                  <Trophy className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>总积分</div>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {profileData?.point || 0}
                </div>
              </div>

              {/* 点赞数卡片 */}
              <div className="rounded-lg px-4 py-3 border transition-all relative" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
                <div className="flex items-center space-x-3 mb-3">
                  <Heart className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>点赞数</div>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {profileData?.likes_count || 0}
                </div>
                <button
                  onClick={() => loadDetailData('likes')}
                  className="absolute top-3 right-3 p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                </button>
              </div>

              {/* 评论数卡片 */}
              <div className="rounded-lg px-4 py-3 border transition-all relative" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
                <div className="flex items-center space-x-3 mb-3">
                  <MessageCircle className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>评论数</div>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {profileData?.comments_count || 0}
                </div>
                <button
                  onClick={() => loadDetailData('comments')}
                  className="absolute top-3 right-3 p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                </button>
              </div>

              {/* 项目参与数卡片 */}
              <div className="rounded-lg px-4 py-3 border transition-all relative" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
                <div className="flex items-center space-x-3 mb-3">
                  <Gift className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>项目参与</div>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {profileData?.project_participation_count || 0}
                </div>
                <button
                  onClick={() => loadDetailData('projects')}
                  className="absolute top-3 right-3 p-1 hover:bg-gray-600 rounded transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                </button>
              </div>

              {/* 被点赞数卡片 */}
              <div className="rounded-lg px-4 py-3 border transition-all" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
                <div className="flex items-center space-x-3 mb-3">
                  <Heart className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>被点赞数</div>
                </div>
                <div className="text-3xl font-bold text-text-primary">
                  {(profileData as any)?.liked_count || 0}
                </div>
              </div>
            </div>

            {/* 积分统计图表区域 */}
            <div className="rounded-lg px-4 py-3 border transition-all" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <BarChart3 className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#aeb9e1' }}>每日积分变动</h3>
                    <p className="text-sm" style={{ color: '#aeb9e1' }}>查看您的积分变动趋势</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[7, 15, 30].map((days) => (
                      <button
                        key={days}
                        onClick={() => setStatsDays(days)}
                        className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                          statsDays == days
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                        }`}
                        style={{
                          backgroundColor: statsDays == days ? '#2d354c' : 'transparent'
                        }}
                      >
                        {days}天
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 积分统计图表和日志 */}
              <div className="h-80">
                {statsLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
                      <p className="text-sm mt-2" style={{ color: '#aeb9e1' }}>加载中...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full gap-4">
                    {/* 左侧：图表区域 (2/3宽度) */}
                    <div className="flex-1">
                      {pointStats && pointStats.daily_breakdown && pointStats.daily_breakdown.length > 0 ? (
                        <div className="h-full">
                          {/* D3曲线图容器 */}
                          <div ref={chartRef} className="w-full h-full"></div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4" style={{ color: '#aeb9e1', opacity: 0.5 }} />
                            <p style={{ color: '#aeb9e1' }}>暂无积分变动数据</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 右侧：积分日志 (1/3宽度) */}
                    <div className="w-1/3">
                      <div className="h-full flex flex-col">
                        <div className="flex items-center space-x-2 mb-3">
                          <History className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                          <h4 className="text-sm font-medium" style={{ color: '#aeb9e1' }}>最近记录</h4>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-2">
                          {pointLogs.length > 0 ? (
                            pointLogs.map((log) => (
                              <div
                                key={log.id}
                                className="rounded-lg p-3 border transition-all"
                                style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <div className={`text-sm font-bold ${getPointChangeColor(log.point_change)}`}>
                                        {getPointChangeIcon(log.point_change)}{log.point_change}
                                      </div>
                                    </div>
                                    <div className="text-xs mb-1" style={{ color: '#aeb9e1' }}>
                                      {log.action_name || log.action_type}
                                    </div>
                                    <div className="text-xs opacity-70" style={{ color: '#aeb9e1' }}>
                                      {log.created_at}
                                    </div>
                                    
                                    {/* 可展开的详细信息 */}
                                    {expandedLogId == log.id && (
                                      <div className="mt-2 pt-2 text-xs space-y-1" style={{ borderTop: '1px solid #2d354c' }}>
                                        <div className="flex justify-between opacity-70" style={{ color: '#aeb9e1' }}>
                                          <span>变动前:</span>
                                          <span>{log.point_before}</span>
                                        </div>
                                        <div className="flex justify-between opacity-70" style={{ color: '#aeb9e1' }}>
                                          <span>变动后:</span>
                                          <span>{log.point_after}</span>
                                        </div>
                                        {log.related_id && (
                                          <div className="flex justify-between opacity-70" style={{ color: '#aeb9e1' }}>
                                            <span>关联ID:</span>
                                            <span>#{log.related_id}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  <button
                                    onClick={() => setExpandedLogId(expandedLogId == log.id ? null : log.id)}
                                    className="text-gray-400 hover:text-yellow-400 transition-colors ml-2"
                                  >
                                    {expandedLogId == log.id ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-xs" style={{ color: '#aeb9e1' }}>
                              <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>暂无积分记录</p>
                            </div>
                          )}
                        </div>

                        {/* 分页 */}
                        {pointTotalPages > 1 && (
                          <div className="flex items-center justify-center space-x-2 mt-3 pt-3" style={{ borderTop: '1px solid #2d354c' }}>
                            <button
                              disabled={pointPage <= 1}
                              onClick={() => setPointPage(p => Math.max(1, p - 1))}
                              className={`px-2 py-1 rounded text-xs transition-all ${
                                pointPage <= 1
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-white hover:bg-gray-600'
                              }`}
                            >
                              上一页
                            </button>
                            <div className="text-xs" style={{ color: '#aeb9e1' }}>
                              {pointPage}/{pointTotalPages}
                            </div>
                            <button
                              disabled={pointPage >= pointTotalPages}
                              onClick={() => setPointPage(p => Math.min(pointTotalPages, p + 1))}
                              className={`px-2 py-1 rounded text-xs transition-all ${
                                pointPage >= pointTotalPages
                                  ? 'text-gray-500 cursor-not-allowed'
                                  : 'text-white hover:bg-gray-600'
                              }`}
                            >
                              下一页
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 邀请管理区域 - 仅大使可见 */}
            {isAmbassador && (
              <div className="bg-background-card rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-text-primary">邀请管理</h3>
                      <p className="text-sm text-text-secondary">邀请好友注册并付费成为会员，您将获得 {user.invite_reward} USDT 奖励</p>
                    </div>
                  </div>
                </div>

                {/* 邀请链接区域 */}
                <div className="mb-6">
                  <div className="bg-background border border-gray-700 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 text-text-primary font-mono text-sm break-all mr-4">
                        {inviteLink}
                      </div>
                      <button
                        onClick={handleCopyLink}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
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
                    <div className="bg-background border border-gray-700 rounded-lg p-4 mb-4">
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

                {/* 邀请统计 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-background border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-pink-400 mb-1">
                      {inviteStats.total}
                    </div>
                    <div className="text-sm text-text-muted mb-2">直邀人数</div>
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {unionInfo?.tree_people_num || 0}
                    </div>
                    <div className="text-text-secondary text-sm">邀请总数</div>
                  </div>
                  
                  <div className="bg-background border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {inviteStats.paid}
                    </div>
                    <div className="text-sm text-text-muted mb-2">直邀VIP</div>
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {unionInfo?.tree_people_vip_num || 0}
                    </div>
                    <div className="text-text-secondary text-sm">VIP总数</div>
                  </div>
                  
                  <div className="bg-background border border-gray-700 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-400 mb-2">
                      {inviteStats.total_reward} USDT
                    </div>
                    <div className="text-text-secondary mb-3 text-sm">邀请佣金（未提现）</div>
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
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-text-primary">邀请记录</h4>
                    <button
                      onClick={() => setInviteRecordsExpanded(!inviteRecordsExpanded)}
                      className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <span>{inviteRecordsExpanded ? '收起' : '展开'}</span>
                      {inviteRecordsExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {inviteRecordsExpanded && (
                    <div className="space-y-3">
                      {unionInfo && unionInfo.people_list && unionInfo.people_list.length > 0 ? (
                        unionInfo.people_list.map((person) => {
                          // 判断VIP状态
                          const isVip = person.viplevel && person.viplevel > 0 && person.vip_vailddate && new Date(parseInt(person.vip_vailddate) * 1000).getTime() > Date.now()
                          const isTradeVip = person.tradelevel && person.tradelevel > 0 && person.trade_vailddate && new Date(parseInt(person.trade_vailddate) * 1000).getTime() > Date.now()
                          
                          return (
                            <div key={person.userid} className="bg-background border border-gray-700 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    {person.avatar ? (
                                      <img src={person.avatar} alt="头像" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-10 h-10 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                        {String(person.userid).slice(-2).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="text-text-primary font-medium">
                                        {person.nickname || `用户 #${person.userid}`}
                                      </div>
                                      <div className="flex items-center space-x-4 text-sm">
                                        <div className="flex items-center space-x-1">
                                          <Crown className={`h-3 w-3 ${isVip ? 'text-yellow-500' : 'text-text-muted'}`} />
                                          <span className={isVip ? 'text-yellow-500 font-medium' : 'text-text-muted'}>
                                            投研VIP: {isVip ? '已开通' : '未开通'}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                          <Trophy className={`h-3 w-3 ${isTradeVip ? 'text-green-500' : 'text-text-muted'}`} />
                                          <span className={isTradeVip ? 'text-green-500 font-medium' : 'text-text-muted'}>
                                            交易VIP: {isTradeVip ? '已开通' : '未开通'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right">
                                    <div className="flex items-center space-x-2">
                                      {isVip && (
                                        <div className="flex items-center space-x-1 text-green-400 text-xs">
                                          <Crown className="h-3 w-3" />
                                          <span>投研VIP</span>
                                        </div>
                                      )}
                                      {isTradeVip && (
                                        <div className="flex items-center space-x-1 text-blue-400 text-xs">
                                          <Trophy className="h-3 w-3" />
                                          <span>交易VIP</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* 设置交易VIP按钮 - 仅当用户有权限且目标用户不是交易VIP时显示 */}
                                  {user?.can_publish_strategy == 1 && !isTradeVip && (
                                    <button
                                      onClick={() => openTradeVipModal(person)}
                                      disabled={grantingTradeVip == person.userid}
                                      className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                                        grantingTradeVip == person.userid
                                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                                      }`}
                                    >
                                      {grantingTradeVip == person.userid ? (
                                        <>
                                          <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                          <span>设置中...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Trophy className="h-3 w-3" />
                                          <span>设置交易VIP</span>
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="text-center py-12 text-text-muted">
                          <Users className="h-12 w-12 mx-auto text-gray-400/50 mb-4" />
                          <p>暂无邀请记录</p>
                        </div>
                      )}

                      {/* 分页控件 */}
                      {unionTotalPages > 1 && (
                        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-700">
                          <button
                            disabled={unionPage <= 1}
                            onClick={() => setUnionPage(p => Math.max(1, p - 1))}
                            className={`px-3 py-2 rounded-lg border ${
                              unionPage <= 1 
                                ? 'text-gray-500 border-gray-700 cursor-not-allowed' 
                                : 'text-text-primary border-gray-700 hover:border-pink-400'
                            }`}
                          >
                            上一页
                          </button>
                          <div className="text-text-secondary text-sm">第 {unionPage} / {unionTotalPages} 页</div>
                          <button
                            disabled={unionPage >= unionTotalPages}
                            onClick={() => setUnionPage(p => Math.min(unionTotalPages, p + 1))}
                            className={`px-3 py-2 rounded-lg border ${
                              unionPage >= unionTotalPages 
                                ? 'text-gray-500 border-gray-700 cursor-not-allowed' 
                                : 'text-text-primary border-gray-700 hover:border-pink-400'
                            }`}
                          >
                            下一页
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 我的互动区域 */}
            <div className="rounded-lg px-4 py-3 border transition-all" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Heart className="h-4 w-4" style={{ color: '#aeb9e1' }} />
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: '#aeb9e1' }}>我的互动</h3>
                    <p className="text-sm" style={{ color: '#aeb9e1' }}>查看您的互动记录</p>
                  </div>
                </div>
              </div>

              {/* Tab导航 */}
              <div className="flex space-x-1 mb-6" style={{ backgroundColor: '#2d354c', borderRadius: '8px', padding: '4px' }}>
                {[
                  { key: 'like', label: '点赞', icon: Heart },
                  { key: 'comment', label: '评论', icon: MessageCircle },
                  { key: 'participate', label: '参与', icon: User }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setInteractionTab(key as any)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded text-sm font-medium transition-all ${
                      interactionTab == key
                        ? 'text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                    style={{
                      backgroundColor: interactionTab == key ? '#aeb9e1' : 'transparent'
                    }}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>

              {/* 互动内容 */}
              <div className="space-y-4">
                {/* 投研活动 */}
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#aeb9e1' }}>投研项目</h4>
                  <div className="space-y-3">
                    {researchActivities.length > 0 ? (
                      researchActivities.slice(0, 3).map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-lg p-3 border transition-all"
                          style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getActionIcon(activity.action)}
                                <span className="text-xs" style={{ color: '#aeb9e1' }}>
                                  {getActionText(activity.action)}
                                </span>
                                <span className="text-xs opacity-70" style={{ color: '#aeb9e1' }}>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {activity.timestamp}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-white mb-1">
                                {activity.reportTitle}
                              </div>
                              {activity.content && (
                                <div className="text-xs opacity-70" style={{ color: '#aeb9e1' }}>
                                  {activity.content.length > 50 ? `${activity.content.slice(0, 50)}...` : activity.content}
                                </div>
                              )}
                            </div>
                            <Link
                              href={`/research?id=${activity.reportId}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs" style={{ color: '#aeb9e1' }}>
                        暂无投研{interactionTab == 'like' ? '点赞' : interactionTab == 'comment' ? '评论' : '参与'}记录
                      </div>
                    )}
                  </div>
                </div>

                {/* 空投活动 */}
                <div>
                  <h4 className="text-sm font-medium mb-3" style={{ color: '#aeb9e1' }}>空投项目</h4>
                  <div className="space-y-3">
                    {airdropActivities.length > 0 ? (
                      airdropActivities.slice(0, 3).map((activity) => (
                        <div
                          key={activity.id}
                          className="rounded-lg p-3 border transition-all"
                          style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                {getActionIcon(activity.action)}
                                <span className="text-xs" style={{ color: '#aeb9e1' }}>
                                  {getActionText(activity.action)}
                                </span>
                                <span className="text-xs opacity-70" style={{ color: '#aeb9e1' }}>
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {activity.timestamp}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-white mb-1">
                                {activity.airdropTitle}
                              </div>
                              {activity.content && (
                                <div className="text-xs opacity-70" style={{ color: '#aeb9e1' }}>
                                  {activity.content.length > 50 ? `${activity.content.slice(0, 50)}...` : activity.content}
                                </div>
                              )}
                            </div>
                            <button className="text-purple-400 hover:text-purple-300 transition-colors p-1">
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-xs" style={{ color: '#aeb9e1' }}>
                        暂无空投{interactionTab == 'like' ? '点赞' : interactionTab == 'comment' ? '评论' : '参与'}记录
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 二维码弹窗 */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-lg max-w-md w-full p-6 border border-gray-700">
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

      {/* 详细列表弹窗 */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="rounded-lg max-w-md w-full p-6 border transition-all" style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: '#aeb9e1' }}>
                {detailType == 'likes' && '点赞的项目/空投'}
                {detailType == 'comments' && '评论的项目/空投'}
                {detailType == 'projects' && '参与的项目/空投'}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <Eye className="h-5 w-5" />
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
                  <p className="text-sm ml-2" style={{ color: '#aeb9e1' }}>加载中...</p>
                </div>
              ) : detailData.length > 0 ? (
                <div className="space-y-3">
                  {detailData.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg p-3 border transition-all"
                      style={{ backgroundColor: '#0b1739', borderColor: '#2d354c' }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">
                            {item.name}
                          </div>
                          <div className="text-xs" style={{ color: '#aeb9e1' }}>
                            {item.type == 'airdrop' ? '空投项目' : '普通项目'} · {item.date}
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 rounded" style={{ backgroundColor: '#2d354c', color: '#aeb9e1' }}>
                          {item.type == 'airdrop' ? '空投' : '项目'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-sm" style={{ color: '#aeb9e1' }}>
                    暂无数据
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 设置交易VIP模态框 */}
      {showTradeVipModal && selectedUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-background-card rounded-lg max-w-md w-full p-6 border border-gray-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-text-primary mb-4">设置交易VIP</h3>
              
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  {selectedUser.avatar ? (
                    <img src={selectedUser.avatar} alt="头像" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {String(selectedUser.userid).slice(-2).toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-text-primary font-medium">
                      {selectedUser.nickname || `用户 #${selectedUser.userid}`}
                    </div>
                    <div className="text-sm text-text-muted">
                      当前状态: {selectedUser.tradelevel && selectedUser.tradelevel > 0 ? '交易VIP' : '普通用户'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    设置有效期（天）
                  </label>
                  <select 
                    className="w-full px-3 py-2 bg-background border border-gray-600 rounded-lg text-text-primary focus:outline-none focus:border-pink-400"
                    defaultValue="365"
                    id="tradeDays"
                  >
                    <option value="30">30天</option>
                    <option value="90">90天</option>
                    <option value="180">180天</option>
                    <option value="365">365天</option>
                    <option value="730">730天</option>
                  </select>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <div className="text-yellow-600 text-sm">
                      ⚠️ 注意：设置后将立即生效，如果用户已有交易VIP，将延长其有效期。
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowTradeVipModal(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const tradeDays = parseInt((document.getElementById('tradeDays') as HTMLSelectElement)?.value || '365')
                    handleGrantTradeVip(selectedUser.userid, tradeDays)
                    setShowTradeVipModal(false)
                  }}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-all"
                >
                  确认设置
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  )
}

