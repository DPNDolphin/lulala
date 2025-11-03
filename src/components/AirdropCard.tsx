'use client'

import { useState } from 'react'
import { Clock, MapPin, Star, TrendingUp, Calendar, Award } from 'lucide-react'
import NativeCalendarButton from './NativeCalendarButton'

interface AirdropData {
  id: string
  token: string
  name: string
  timestamp: string
  time: string
  points: string
  type: string
  phase: string
  language: string
  status: string
  pretge: string
  bctge: string
  futures_listed: string
  amount: string
  created_timestamp: string
  updated_timestamp: string
  system_timestamp: string
  completed: string
  has_homonym: string
  spot_listed: string
  contract_address: string
  chain_id: string
  target_bnb: string | null
  actual_bnb: string | null
  collection_address: string | null
  tge_total: string | null
  utc: string | null
  data_hash: string
  created_at: string
  updated_at: string
  price?: string | null
  dex_price?: string | null
}

interface AirdropCardProps {
  airdrop: AirdropData
  isToday?: boolean // 新增属性来区分是否为今日空投
}

export default function AirdropCard({ airdrop, isToday = false }: AirdropCardProps) {
  const [imageError, setImageError] = useState(false)
  
  // 格式化时间戳为可读日期
  const formatDate = (timestamp: string) => {
    const date = new Date(parseInt(timestamp) * 1000)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  // 生成日历事件所需日期字符串 YYYY-MM-DD
  const toDateString = (timestamp: string) => {
    const d = new Date(parseInt(timestamp) * 1000)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // 解析时间 HH:mm，默认 20:00
  const parseStartTime = (timeStr?: string) => {
    if (timeStr && /^(\d{1,2}):(\d{2})$/.test(timeStr.trim())) {
      const [hh, mm] = timeStr.trim().split(':')
      return `${String(Math.min(23, parseInt(hh))).padStart(2, '0')}:${String(parseInt(mm)).padStart(2, '0')}`
    }
    return '20:00'
  }

  // 计算结束时间 +1 小时（简单加法，不跨日复杂处理）
  const calcEndTime = (start: string) => {
    const [hh, mm] = start.split(':').map((v) => parseInt(v))
    const date = new Date()
    date.setHours(hh, mm, 0, 0)
    date.setTime(date.getTime() + 60 * 60 * 1000)
    const eh = String(date.getHours()).padStart(2, '0')
    const em = String(date.getMinutes()).padStart(2, '0')
    return `${eh}:${em}`
  }

  // 获取链名称
  const getChainName = (chainId: string) => {
    const chainMap: { [key: string]: string } = {
      '56': 'BSC',
      '1': 'Ethereum',
      '137': 'Polygon',
      '501': 'Solana',
      '250': 'Fantom',
      '43114': 'Avalanche'
    }
    return chainMap[chainId] || `Chain ${chainId}`
  }

  // 获取链简称（用于API路径）
  const getChainShortName = (chainId: string) => {
    const chainMap: { [key: string]: string } = {
      '56': 'bsc',
      '1': 'eth',
      '137': 'polygon',
      '501': 'solana',
      '250': 'fantom',
      '43114': 'avalanche'
    }
    return chainMap[chainId] || 'eth'
  }

  // 获取类型显示文本
  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'grab': '抢购',
      'claim': '领取',
      'trade': '交易',
      'tge': 'TGE'
    }
    return typeMap[type] || type
  }

  // 获取阶段显示文本
  const getPhaseText = (phase: string) => {
    const phaseMap: { [key: string]: string } = {
      '1': '第一阶段',
      '2': '第二阶段',
      '3': '第三阶段'
    }
    return phaseMap[phase] || `第${phase}阶段`
  }

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'announced': 'text-blue-400 bg-blue-400/20',
      'active': 'text-green-400 bg-green-400/20',
      'completed': 'text-gray-400 bg-gray-400/20',
      'cancelled': 'text-red-400 bg-red-400/20'
    }
    return statusMap[status] || 'text-gray-400 bg-gray-400/20'
  }

  // 获取状态文本
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'announced': '已预告',
      'active': '进行中',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusMap[status] || status
  }

  // 计算金额
  const calculateValue = () => {
    if (!airdrop.amount || !airdrop.price) return null
    const amount = parseFloat(airdrop.amount)
    const price = parseFloat(airdrop.price)
    if (isNaN(amount) || isNaN(price)) return null
    const value = amount * price
    return value.toFixed(2)
  }

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-pink-400/30 transition-all duration-300">
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-gray-800">
            {airdrop.contract_address && !imageError ? (
              <img 
                src={`https://debot.ai/api/market/token/image1/${getChainShortName(airdrop.chain_id)}/${airdrop.contract_address.toLowerCase()}`}
                alt={airdrop.token}
                className="w-full h-full object-cover"
                onError={() => {
                  console.error('🖼️ Logo 加载失败:', {
                    src: `https://debot.ai/api/market/token/image1/${getChainShortName(airdrop.chain_id)}/${airdrop.contract_address.toLowerCase()}`,
                    token: airdrop.token,
                    contract_address: airdrop.contract_address,
                    chain_id: airdrop.chain_id
                  })
                  setImageError(true)
                }}
                onLoad={() => {
                  console.log('✅ Logo 加载成功:', airdrop.token, airdrop.contract_address)
                }}
              />
            ) : (
              <div className="">
                
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{airdrop.token}</h3>
            <p className="text-gray-400 text-xs">{airdrop.name}</p>
            <div className="mt-1 flex items-center space-x-3">
              <span className="text-pink-400 text-sm font-bold bg-pink-400/10 px-2 py-0.5 rounded">积分 {airdrop.points || '-'}</span>
              <span className="text-blue-400 text-sm font-bold bg-blue-400/10 px-2 py-0.5 rounded">
                数量 {airdrop.amount || '-'}
              </span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${airdrop.completed === '1' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-300'}`}>
                {airdrop.completed === '1' ? '已完成' : '进行中'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 基本信息（根据是否为今日空投决定是否显示日期，移除链信息） */}
      <div className="space-y-2 mb-3">
        {!isToday && (
          <div className="flex items-center space-x-2 text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">日期</span>
            <span className="text-white font-medium text-sm">{formatDate(airdrop.timestamp)}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-gray-300">
          <Clock className="h-4 w-4" />
          <span className="text-xs">时间</span>
          <span className="text-white font-medium text-sm">{airdrop.time || '-'}</span>
          {/* 添加到日历按钮（紧贴时间，仅在时间存在时显示） */}
          {airdrop.time && airdrop.time.trim() !== '' && (
            <div className="ml-2">
              <NativeCalendarButton
                airdropId={airdrop.id}
                className="text-xs"
              />
            </div>
          )}
        </div>
      </div>

      {/* 详细信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2 flex-1">
          {airdrop.type && airdrop.type.trim() !== '' && (
            <div className="flex items-center space-x-2 text-gray-300">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">类型</span>
              <span className="text-white font-medium text-sm">{getTypeText(airdrop.type)}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-2 text-gray-300">
            <Star className="h-4 w-4" />
            <span className="text-xs">状态</span>
            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(airdrop.status)}`}>
              {getStatusText(airdrop.status)}
            </span>
          </div>
        </div>
        
        {/* 价格显示在右侧 */}
        {calculateValue() && (
          <div className="text-right ml-4">
            <div className="text-green-400 font-bold text-xl">
              ${calculateValue()}
            </div>
            <div className="text-gray-400 text-xs">
              预估价值
            </div>
          </div>
        )}
      </div>

      {/* 底部信息（保留期货标识） */}
      {(airdrop.futures_listed === '1') && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <div className="flex items-center space-x-1 text-green-400 text-xs">
            <Award className="h-4 w-4" />
            <span>期货已上线</span>
          </div>
          <div />
        </div>
      )}
    </div>
  )
}
