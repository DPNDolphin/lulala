'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Clock, MapPin, Star, TrendingUp, Calendar, Award } from 'lucide-react'

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
}

interface AirdropCardProps {
  airdrop: AirdropData
}

export default function AirdropCard({ airdrop }: AirdropCardProps) {
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

  // 获取类型显示文本
  const getTypeText = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'grab': '抢购',
      'claim': '领取',
      'trade': '交易'
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

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 hover:border-pink-400/30 transition-all duration-300">
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden bg-gray-800">
            {airdrop.contract_address && !imageError ? (
              <Image 
                src={`https://rs.debot.ai/logo/${airdrop.contract_address}.png`}
                alt={airdrop.token}
                width={48}
                height={48}
                className="w-full h-full object-cover"
                onError={() => {
                  console.error('🖼️ Logo 加载失败:', {
                    src: `https://rs.debot.ai/logo/${airdrop.contract_address}.png`,
                    token: airdrop.token,
                    contract_address: airdrop.contract_address
                  })
                  setImageError(true)
                }}
                onLoad={() => {
                  console.log('✅ Logo 加载成功:', airdrop.token, airdrop.contract_address)
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                {airdrop.token}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">{airdrop.name}</h3>
            <p className="text-gray-400 text-xs">{airdrop.token}</p>
            <div className="mt-1 flex items-center space-x-3">
              <span className="text-pink-400 text-sm font-bold bg-pink-400/10 px-2 py-0.5 rounded">积分 {airdrop.points}</span>
              <span className="text-blue-400 text-sm font-bold bg-blue-400/10 px-2 py-0.5 rounded">数量 {airdrop.amount}</span>
              <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${airdrop.completed === '1' ? 'bg-green-400/20 text-green-400' : 'bg-yellow-400/20 text-yellow-300'}`}>
                {airdrop.completed === '1' ? '已完成' : '进行中'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 基本信息（保留日期、时间、链） */}
      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-300">
            <Calendar className="h-4 w-4" />
            <span className="text-xs">日期</span>
          </div>
          <span className="text-white font-medium text-sm">{formatDate(airdrop.timestamp)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-300">
            <Clock className="h-4 w-4" />
            <span className="text-xs">时间</span>
          </div>
          <span className="text-white font-medium text-sm">{airdrop.time}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-gray-300">
            <MapPin className="h-4 w-4" />
            <span className="text-xs">链</span>
          </div>
          <span className="text-white font-medium text-sm">{getChainName(airdrop.chain_id)}</span>
        </div>
      </div>

      {/* 详细信息（隐藏状态与类型，精简布局） */}

    

      {/* 底部信息（去除数量与完成态，保留期货标识） */}
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
