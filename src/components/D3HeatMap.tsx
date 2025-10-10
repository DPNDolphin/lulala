'use client'

import { useState, useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { TrendingUp, TrendingDown, Eye, BarChart3, Crown, RefreshCw } from 'lucide-react'
import { airdropsAPI, type AirdropProject } from '@/lib/airdropsAPI'
import HeatTrendChart from './HeatTrendChart'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { useToast } from './Toast'


interface Project {
  id: string
  name: string
  tag: string
  heatScore: number
  views: number
  mentions: number
  icon: string
  is_vip: number
}

interface D3HeatMapProps {
  timeFrame?: string
  onAirdropSelect?: (airdropId: number) => void
}

export default function D3HeatMap({ timeFrame = '7d', onAirdropSelect }: D3HeatMapProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [selectedTimeFrame, setSelectedTimeFrame] = useState(timeFrame)
  const [selectedProjectType, setSelectedProjectType] = useState<'normal' | 'vip'>('normal')
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(false)
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 })
  const [airdropProjects, setAirdropProjects] = useState<AirdropProject[]>([])
  const [error, setError] = useState<string | null>(null)
  
  // 认证和Toast
  const { isAuthenticated, user } = useMultiAuth()
  const { showError, ToastContainer } = useToast()

  // 响应式尺寸计算
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth
        const containerHeight = containerRef.current.offsetHeight
        const width = Math.min(containerWidth, 1200) // 最大1200px
        // 使用容器高度的85%，减去控制栏高度，确保充分利用空间
        const controlsHeight = 80 // 控制栏大约高度
        const availableHeight = containerHeight - controlsHeight
        const height = Math.max(
          availableHeight * 0.9, 
          width * 0.6, 
          400
        )
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateDimensions)
      return () => window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  // 加载空投项目数据
  useEffect(() => {
    const loadAirdropData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        // 根据时间框架选择排序字段
        let sortField = 'heat_7d'
        switch (selectedTimeFrame) {
          case '7d':
            sortField = 'heat_7d'
            break
          case '30d':
            sortField = 'heat_30d'
            break
          case '90d':
            sortField = 'heat_90d'
            break
          case 'all':
            sortField = 'heat_total'
            break
          default:
            sortField = 'heat_7d'
        }
        
        const response = await airdropsAPI.getAirdrops({
          limit: 100, // 获取更多数据以便随机抽取
          sort: sortField,
          order: 'DESC',
          is_vip: selectedProjectType === 'vip' ? '1' : '0'
        })
        
        if (response.api_code == 200 && response.data) {
          // 随机抽取20个项目
          const allProjects = response.data.airdrops
          const shuffledProjects = [...allProjects].sort(() => Math.random() - 0.5)
          const randomProjects = shuffledProjects.slice(0, 20)
          setAirdropProjects(randomProjects)
        } else {
          setError(response.api_msg || '获取数据失败')
        }
      } catch (err) {
        console.error('加载空投数据失败:', err)
        setError('网络错误，请稍后重试')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadAirdropData()
  }, [selectedTimeFrame, selectedProjectType, refreshKey])

  // 转换空投项目数据为热力图格式
  const projects: Project[] = airdropProjects.map(airdrop => {
    // 根据时间框架选择热度值
    let heatScore = airdrop.heat_7d
    switch (selectedTimeFrame) {
      case '7d':
        heatScore = airdrop.heat_7d
        break
      case '30d':
        heatScore = airdrop.heat_30d
        break
      case '90d':
        heatScore = airdrop.heat_90d
        break
      case 'all':
        heatScore = airdrop.heat_total
        break
      default:
        heatScore = airdrop.heat_7d
    }
    
    return {
      id: airdrop.id.toString(),
      name: airdrop.name,
      tag: airdrop.tags[0] || '其他',
      heatScore: heatScore,
      views: airdrop.views,
      mentions: airdrop.comments_count,
      icon: airdrop.icon || 'https://admin.lulala.vip/storage/avatar/1755937852TkzEoFbvmC.jpg',
      is_vip: airdrop.is_vip
    }
  })

  const timeFrames = [
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' },
    { value: 'all', label: '全部' }
  ]

  const projectTypes = [
    { value: 'normal', label: '普通项目' },
    { value: 'vip', label: 'VIP项目' }
  ]

  // 检查用户是否有VIP权限
  const isVipUser = () => {
    if (!isAuthenticated || !user) return false
    return user.vip_level && user.vip_level > 0 && user.vip_vailddate && user.vip_vailddate > Date.now() / 1000
  }

  // 检查是否可以查看VIP项目
  const canViewVipProjects = () => {
    return isAuthenticated && isVipUser()
  }

  // 根据项目类型筛选项目
  const filteredProjects = projects.filter(project => {
    switch (selectedProjectType) {
      case 'normal':
        return project.is_vip === 0
      case 'vip':
        return project.is_vip === 1
      default:
        return project.is_vip === 0 // 默认显示普通项目
    }
  })

  // 按热度排序
  const filteredAndSortedProjects = filteredProjects
    .sort((a, b) => b.heatScore - a.heatScore)

  // 获取热度颜色
  const getHeatColor = (heatScore: number, ranking: number) => {
    // 第一名专用颜色
    if (ranking === 1) {
      return '#28a271'
    }
    
    // 其他排名从指定颜色列表中随机选择
    const colors = [
      '#28a271',
      '#5f2934',
      '#ad2e44',
      '#297859',
      '#41262e',
      '#302429',
      '#8f2d3e'
    ]
    
    // 使用项目ID作为随机种子，确保颜色稳定
    const colorIndex = parseInt(heatScore.toString()) % colors.length
    return colors[colorIndex]
  }

  // 获取边框颜色
  const getBorderColor = (project: Project, ranking: number) => {
    if (ranking === 1) {
      return '#fde69f' // 第一名
    } else if (ranking === 2) {
      return '#e1e1db' // 第二名
    } else if (ranking === 3) {
      return '#fcc7ad' // 第三名
    }
    
    // 其他排名使用透明边框（与背景色一样，看不出边框）
    return 'transparent'
  }

  // 刷新数据函数
  const refreshData = () => {
    setRefreshKey(prev => prev + 1)
  }

  // D3 Treemap 渲染
  useEffect(() => {
    if (!svgRef.current || filteredAndSortedProjects.length === 0 || isLoading) return

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    // 添加渐变定义
    const defs = svg.append("defs")
    
    // 第一名金色渐变
    const gradient1 = defs.append("linearGradient")
      .attr("id", "crown-gradient-1")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%")
    gradient1.append("stop").attr("offset", "0%").attr("stop-color", "#D1B673")
    gradient1.append("stop").attr("offset", "50%").attr("stop-color", "#FAF6D0")
    gradient1.append("stop").attr("offset", "100%").attr("stop-color", "#E8CB89")

    // 第二名银色渐变
    const gradient2 = defs.append("linearGradient")
      .attr("id", "crown-gradient-2")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%")
    gradient2.append("stop").attr("offset", "0%").attr("stop-color", "#DAD5CF")
    gradient2.append("stop").attr("offset", "47.5%").attr("stop-color", "#FEFEF6")
    gradient2.append("stop").attr("offset", "100%").attr("stop-color", "#D1D1C9")

    // 第三名铜色渐变
    const gradient3 = defs.append("linearGradient")
      .attr("id", "crown-gradient-3")
      .attr("x1", "0%").attr("y1", "0%")
      .attr("x2", "0%").attr("y2", "100%")
    gradient3.append("stop").attr("offset", "0%").attr("stop-color", "#FBCCB6")
    gradient3.append("stop").attr("offset", "47.5%").attr("stop-color", "#FEEDE3")
    gradient3.append("stop").attr("offset", "100%").attr("stop-color", "#F5C6B1")


    const width = dimensions.width
    const height = dimensions.height
    const padding = 4

    // 创建数据层次结构
    const root = d3.hierarchy({ children: filteredAndSortedProjects })
      .sum(d => (d as any).heatScore || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0))

    // 创建 treemap 布局
    const treemap = d3.treemap()
      .size([width - padding * 2, height - padding * 2])
      .padding(8) // 增加卡片间隙，补偿粗边框的影响
      .round(true)

    treemap(root as any)

    // 创建节点
    const nodes = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${(d as any).x0 + padding},${(d as any).y0 + padding})`)

    // 添加矩形
    nodes.append("rect")
      .attr("width", d => Math.max(0, (d as any).x1 - (d as any).x0))
      .attr("height", d => Math.max(0, (d as any).y1 - (d as any).y0))
      .attr("fill", (d, i) => getHeatColor((d as any).data.heatScore, i + 1))
      .attr("stroke", (d, i) => getBorderColor((d as any).data, i + 1))
      .attr("stroke-width", 1.5)
      .attr("rx", 4)
      .style("cursor", "pointer")
      .on("mouseenter", function(event, d) {
        setHoveredProject((d as any).data.id)
        d3.select(this).attr("fill-opacity", 0.7)
      })
      .on("mouseleave", function(event, d) {
        setHoveredProject(null)
        d3.select(this).attr("fill-opacity", 1)
      })
      .on("click", function(event, d) {
        event.stopPropagation() // 防止事件冒泡
        
        const project = (d as any).data
        
        // 检查VIP权限 - 未登录用户或非VIP用户无法点击VIP项目
        if (project.is_vip === 1 && !canViewVipProjects()) {
          if (!isAuthenticated) {
            showError('请先登录', '您需要登录后才能查看VIP项目')
          } else {
            showError('权限不足', '您没有VIP项目权限')
          }
          return
        }
        
        // 点击触发弹出窗口
        const projectId = parseInt(project.id)
        if (onAirdropSelect) {
          onAirdropSelect(projectId)
        }
      })

    // 添加文本
    nodes.each(function(d, i) {
      const node = d3.select(this)
      const width = (d as any).x1 - (d as any).x0
      const height = (d as any).y1 - (d as any).y0
      const ranking = i + 1



      // 根据设备类型调整显示阈值
      const isMobile = dimensions.width < 768
      const showTagThreshold = isMobile ? 40 : 60
      const showViewsThreshold = isMobile ? 80 : 120

      // 项目标签 - 根据屏幕大小动态显示，居中显示
      if (width > showTagThreshold) {
        node.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("fill", "rgba(255,255,255,0.9)")
          .style("font-size", isMobile ? "10px" : "12px")
          .style("font-weight", "bold")
          .style("pointer-events", "none") // 让点击事件穿透
          .text((d as any).data.tag)
      }

      // 浏览量 - 根据屏幕大小动态显示
      if (width > showViewsThreshold) {
        node.append("text")
          .attr("x", width / 2)
          .attr("y", height / 2 + 20)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .style("fill", "rgba(255,255,255,0.8)")
          .style("font-size", isMobile ? "9px" : "11px")
          .style("pointer-events", "none") // 让点击事件穿透
          .text("👁 " + ((d as any).data.views / 1000).toFixed(1) + "k")
      }

      // 项目图标和名称 - 左上角
      const iconSize = isMobile ? 24 : 32
      const iconPadding = 6
      
      // 添加图标背景
      node.append("rect")
        .attr("x", iconPadding)
        .attr("y", iconPadding)
        .attr("width", iconSize)
        .attr("height", iconSize)
        .attr("fill", "rgba(0,0,0,0.6)")
        .attr("rx", iconSize / 2) // 圆形背景
        .style("pointer-events", "none") // 让点击事件穿透

      // 添加项目图标
      node.append("image")
        .attr("x", iconPadding + 2)
        .attr("y", iconPadding + 2)
        .attr("width", iconSize - 4)
        .attr("height", iconSize - 4)
        .attr("href", (d as any).data.icon)
        .attr("clip-path", `circle(${(iconSize - 4) / 2}px at ${(iconSize - 4) / 2}px ${(iconSize - 4) / 2}px)`)
        .style("object-fit", "cover")
        .style("pointer-events", "none") // 让点击事件穿透

      // 如果空间足够，显示项目名称
      if (width > (iconSize + iconPadding * 3)) {
        // 计算可用的名称宽度（整个卡片宽度减去图标和间距）
        const availableWidth = width - iconSize - iconPadding * 3
        const fontSize = isMobile ? 12 : 16
        
        // 估算可显示的字符数（大致按字体大小计算）
        const estimatedCharWidth = fontSize * 0.6
        const maxChars = Math.floor(availableWidth / estimatedCharWidth)
        
        // 名称文字（无背景）
        node.append("text")
          .attr("x", iconSize + iconPadding * 2)
          .attr("y", iconPadding + iconSize / 2)
          .attr("dominant-baseline", "middle")
          .style("fill", "white")
          .style("font-size", fontSize + "px")
          .style("font-weight", "bold")
          .style("text-shadow", "2px 2px 4px rgba(0,0,0,0.8)")
          .style("pointer-events", "none") // 让点击事件穿透
          .text((d as any).data.name.length > maxChars ? (d as any).data.name.substring(0, maxChars - 3) + "..." : (d as any).data.name)
      }


      

      // 前三名皇冠 - 右上角
      if (ranking <= 3) {
        const crownSize = isMobile ? 0.6 : 0.7 // 移动端缩小皇冠
        const crownOffset = isMobile ? 24 : 28
        const crownGroup = node.append("g")
          .attr("transform", `translate(${width - crownOffset}, 2)`)

        // 根据排名选择颜色
        const getCrownColors = (rank: number) => {
          switch (rank) {
            case 1:
              return { gradient: 'url(#crown-gradient-1)', text: '#6E2A00' }
            case 2:
              return { gradient: 'url(#crown-gradient-2)', text: '#3C280F' }
            case 3:
              return { gradient: 'url(#crown-gradient-3)', text: '#7D5842' }
            default:
              return { gradient: 'url(#crown-gradient-1)', text: '#6E2A00' }
          }
        }

        const colors = getCrownColors(ranking)

        // 皇冠主体路径 - 缩放到合适大小
        const crownPath = "M32.0007 15.5539C31.0477 15.5539 30.2746 16.3456 30.2746 17.3226C30.2746 17.5785 30.3301 17.8204 30.4257 18.0398L24.2337 20.8597L19.0587 11.7693C19.5705 11.4624 19.9186 10.8995 19.9186 10.2477C19.9186 9.27075 19.1459 8.47903 18.1924 8.47903C17.239 8.47903 16.4662 9.27075 16.4662 10.2477C16.4662 10.8802 16.7929 11.4311 17.2801 11.7436L11.7198 20.8597L5.52773 18.0398C5.62301 17.8201 5.67891 17.5785 5.67891 17.3226C5.67891 16.3459 4.90617 15.5539 3.95273 15.5539C2.9993 15.5539 2.22656 16.3456 2.22656 17.3226C2.22656 18.2992 2.9993 19.0913 3.95273 19.0913C4.09301 19.0913 4.22766 19.0695 4.35809 19.0372L7.40438 31.9142H28.5484L31.5947 19.0372C31.7251 19.0695 31.8598 19.0913 32 19.0913C32.9535 19.0913 33.7262 18.2996 33.7262 17.3226C33.7266 16.3459 32.9538 15.5539 32.0007 15.5539Z"

        crownGroup.append("path")
          .attr("d", crownPath)
          .attr("transform", `scale(${crownSize}) translate(-3, -3)`)
          .style("fill", colors.gradient)
          .style("pointer-events", "none") // 让点击事件穿透

        // 数字文本 - 根据排名显示不同数字
        if (ranking === 1) {
          // 数字 "1" 的路径
          const numberPath = "M16.3434 23.9417C16.3901 23.7364 16.4367 23.5451 16.4834 23.3677C16.5301 23.1811 16.5767 23.0037 16.6234 22.8357C16.6701 22.6677 16.7167 22.4997 16.7634 22.3317C16.6794 22.4251 16.5814 22.5277 16.4694 22.6397C16.3667 22.7517 16.2641 22.8497 16.1614 22.9337L15.1254 23.8017L14.1034 22.2757L17.6874 19.2657H19.7594L17.6314 29.2617H15.2374L16.3434 23.9417Z"
          crownGroup.append("path")
            .attr("d", numberPath)
            .attr("transform", `scale(${crownSize}) translate(-3, -3)`)
            .style("fill", colors.text)
            .style("pointer-events", "none") // 让点击事件穿透
        } else if (ranking === 2) {
          // 数字 "2" 的路径
          const numberPath = "M13.622 31.51L13.986 29.844L16.618 27.002C16.87 26.7313 17.094 26.47 17.29 26.218C17.4953 25.9567 17.6727 25.7047 17.822 25.462C17.9807 25.21 18.0973 24.972 18.172 24.748C18.256 24.5147 18.298 24.2953 18.298 24.09C18.298 23.894 18.2607 23.7447 18.186 23.642C18.1207 23.5393 18.0227 23.488 17.892 23.488C17.7147 23.488 17.528 23.544 17.332 23.656C17.136 23.768 16.94 23.9127 16.744 24.09C16.5573 24.258 16.3707 24.4307 16.184 24.608L15.302 22.956C15.7687 22.4147 16.2587 22.018 16.772 21.766C17.2947 21.5047 17.8547 21.374 18.452 21.374C18.9093 21.374 19.3107 21.4673 19.656 21.654C20.0013 21.8407 20.272 22.102 20.468 22.438C20.6733 22.7647 20.776 23.152 20.776 23.6C20.776 24.104 20.692 24.5847 20.524 25.042C20.356 25.49 20.104 25.9427 19.768 26.4C19.432 26.848 19.0167 27.3193 18.522 27.814L17.01 29.354V29.41H19.824L19.362 31.51H13.622Z"
          crownGroup.append("path")
            .attr("d", numberPath)
            .attr("transform", `scale(${crownSize}) translate(-3, -3)`)
            .style("fill", colors.text)
            .style("pointer-events", "none") // 让点击事件穿透
        } else if (ranking === 3) {
          // 数字 "3" 的路径
          const numberPath = "M16.184 32.0681C15.7547 32.0681 15.3673 32.0261 15.022 31.9421C14.686 31.8674 14.35 31.7321 14.014 31.5361L14.028 29.3241C14.364 29.5761 14.7327 29.7581 15.134 29.8701C15.5353 29.9728 15.8947 30.0241 16.212 30.0241C16.4173 30.0241 16.6087 29.9961 16.786 29.9401C16.9633 29.8841 17.1127 29.8048 17.234 29.7021C17.3647 29.5901 17.4673 29.4501 17.542 29.2821C17.6167 29.1141 17.654 28.9181 17.654 28.6941C17.654 28.5074 17.612 28.3488 17.528 28.2181C17.444 28.0781 17.2993 27.9708 17.094 27.8961C16.898 27.8214 16.6133 27.7841 16.24 27.7841H15.722L16.128 25.8241H16.674C16.9447 25.8241 17.1873 25.8008 17.402 25.7541C17.6167 25.6981 17.7987 25.6141 17.948 25.5021C18.1067 25.3808 18.228 25.2361 18.312 25.0681C18.396 24.8908 18.438 24.6854 18.438 24.4521C18.438 24.2654 18.3867 24.1161 18.284 24.0041C18.1907 23.8921 18.0273 23.8361 17.794 23.8361C17.5793 23.8361 17.3273 23.8874 17.038 23.9901C16.758 24.0928 16.4547 24.2561 16.128 24.4801L15.526 22.7161C16.002 22.3801 16.4547 22.1421 16.884 22.0021C17.3227 21.8621 17.8173 21.7921 18.368 21.7921C18.8253 21.7921 19.2453 21.8668 19.628 22.0161C20.0107 22.1561 20.3187 22.3801 20.552 22.6881C20.7853 22.9868 20.902 23.3834 20.902 23.8781C20.902 24.3354 20.804 24.7508 20.608 25.1241C20.4213 25.4881 20.16 25.8054 19.824 26.0761C19.4973 26.3374 19.1147 26.5381 18.676 26.6781V26.7341C19.18 26.8461 19.5533 27.0748 19.796 27.4201C20.048 27.7561 20.174 28.1761 20.174 28.6801C20.174 29.2028 20.0713 29.6741 19.866 30.0941C19.6607 30.5141 19.376 30.8688 19.012 31.1581C18.648 31.4474 18.2233 31.6714 17.738 31.8301C17.262 31.9888 16.744 32.0681 16.184 32.0681Z"
          crownGroup.append("path")
            .attr("d", numberPath)
            .attr("transform", `scale(${crownSize}) translate(-3, -3)`)
            .style("fill", colors.text)
            .style("pointer-events", "none") // 让点击事件穿透
        } else {
          // 对于其他排名，使用简单的文本
          crownGroup.append("text")
            .attr("x", 12)
            .attr("y", 14)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("fill", colors.text)
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("pointer-events", "none") // 让点击事件穿透
            .text(ranking)
        }
      }
    })

  }, [filteredAndSortedProjects, isLoading, dimensions, onAirdropSelect])

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col">
      {/* Controls */}
      <div className="flex flex-col gap-3 mb-4 justify-center flex-shrink-0">
        {/* 第一行：时间选择和刷新按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* 时间选择 */}
          <div className="flex bg-background-secondary rounded-lg p-1">
            {timeFrames.map((frame) => (
              <button
                key={frame.value}
                onClick={() => setSelectedTimeFrame(frame.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedTimeFrame === frame.value
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-text-secondary hover:text-primary hover:bg-primary/10'
                }`}
              >
                {frame.label}
              </button>
            ))}
          </div>
          
          {/* 刷新按钮 */}
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-background-secondary border border-gray-700 rounded-lg text-text-primary text-sm hover:bg-primary/10 hover:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>

        {/* 第二行：项目类型筛选 */}
        <div className="flex justify-center">
          <div className="flex bg-background-secondary rounded-lg p-1">
            {projectTypes.map((type) => {
              const isVipType = type.value === 'vip'
              const canClick = !isVipType || canViewVipProjects()
              
              return (
                <button
                  key={type.value}
                  onClick={() => {
                    if (isVipType && !canViewVipProjects()) {
                      if (!isAuthenticated) {
                        showError('请先登录', '您需要登录后才能查看VIP项目')
                      } else {
                        showError('权限不足', '您没有VIP项目权限')
                      }
                      return
                    }
                    setSelectedProjectType(type.value as 'normal' | 'vip')
                  }}
                  disabled={!canClick}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    selectedProjectType === type.value
                      ? 'bg-primary text-white shadow-lg'
                      : canClick
                        ? 'text-text-secondary hover:text-primary hover:bg-primary/10'
                        : 'text-text-muted cursor-not-allowed opacity-50'
                  }`}
                >
                  {type.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* D3 Treemap */}
      <div className="w-full flex-1 flex justify-center items-center">
        {isLoading ? (
          <div className="flex items-center justify-center w-full" style={{ height: `${dimensions.height}px` }}>
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-text-muted">加载热力图数据...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center w-full" style={{ height: `${dimensions.height}px` }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-red-500 mb-2">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="text-primary hover:text-primary-light text-sm"
              >
                重新加载
              </button>
            </div>
          </div>
        ) : filteredAndSortedProjects.length === 0 ? (
          <div className="flex items-center justify-center w-full" style={{ height: `${dimensions.height}px` }}>
            <div className="text-center">
              <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-text-muted" />
              </div>
              <p className="text-text-muted">当前筛选条件下没有找到项目</p>
              <button 
                onClick={refreshData}
                className="mt-2 text-primary hover:text-primary-light text-sm"
              >
                刷新数据
              </button>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        )}
      </div>
      
      {/* Toast容器 */}
      <ToastContainer />
    </div>
  )
}
