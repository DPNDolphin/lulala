'use client'

import { useState, useEffect } from 'react'
// 移除 wagmi 依赖，因为现在支持多种登录方式，不仅仅是钱包
import { Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useMultiAuth } from '@/contexts/MultiAuthContext'

interface MembershipInfo {
  isActive: boolean
  expiryDate?: Date
  isTradeActive?: boolean
  tradeExpiryDate?: Date
  isAmbassador?: boolean
  usertype?: number
}

export default function MembershipStatus() {
  const { isAuthenticated, user } = useMultiAuth()
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo>({
    isActive: false
  })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 从用户数据获取会员信息
  useEffect(() => {
    if (isAuthenticated && user) {
      // 从用户数据中获取VIP信息，系统会自动处理过期重置
      const isVipActive = user.vip_level && user.vip_level > 0
      const isTradeActive = user.trade_level && user.trade_level > 0
      const isAmbassador = user.usertype == 1
      let expiryDate: Date | undefined
      let tradeExpiryDate: Date | undefined
      
      // 如果是VIP用户，显示到期时间
      if (isVipActive && user.vip_vailddate && user.vip_vailddate > 0) {
        // 将Unix时间戳转换为Date对象
        expiryDate = new Date(user.vip_vailddate * 1000)
      }
      if (isTradeActive && user.trade_vailddate && user.trade_vailddate > 0) {
        tradeExpiryDate = new Date(user.trade_vailddate * 1000)
      }
      setMembershipInfo({
        isActive: isVipActive || false,
        expiryDate: expiryDate,
        isTradeActive: isTradeActive || false,
        tradeExpiryDate: tradeExpiryDate,
        isAmbassador: isAmbassador || false
      })
    } else {
      setMembershipInfo({ isActive: false, isTradeActive: false, isAmbassador: false })
    }
  }, [isAuthenticated, user])

  const getMembershipInfo = () => {
    if (membershipInfo.isActive) {
      return {
        name: '年费会员',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10 border-amber-400/30'
      }
    } else {
      return {
        name: '免费用户',
        color: 'text-gray-400',
        bgColor: 'bg-gray-400/10 border-gray-400/30'
      }
    }
  }

  if (!isClient || !isAuthenticated) {
    return null
  }

  const memberInfo = getMembershipInfo()

  return (
    <Link href="/profile" className="block">
      <div className={`rounded-lg p-3 border ${memberInfo.bgColor} hover:bg-pink-400/5 hover:border-pink-400/50 transition-all cursor-pointer`}>
        <div className="flex items-center space-x-2">
          <div className="flex-1">
            <div className={`text-sm font-medium ${memberInfo.color} flex items-center space-x-2`}>
              <span>{memberInfo.name}</span>
              {membershipInfo.isActive && (
                <div className="relative group">
                  <Image 
                    src="/vip-pass.png" 
                    alt="年费会员" 
                    width={20} 
                    height={20}
                    className="cursor-help"
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    VIP会员专属标识
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
              {membershipInfo.isTradeActive && (
                <div className="relative group">
                  <Image 
                    src="/vip-trade.png" 
                    alt="交易会员" 
                    width={20} 
                    height={20}
                    className="cursor-help"
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    VIP交易会员专属标识
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
              {membershipInfo.isAmbassador && (
                <div className="relative group">
                  <Image 
                    src="/necktie.png" 
                    alt="LULALA大使" 
                    width={20} 
                    height={20}
                    className="cursor-help"
                  />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    LULALA大使专属标识
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              )}
            </div>
            {membershipInfo.expiryDate && membershipInfo.isActive && isClient && (
              <div className="text-xs text-text-muted flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>
                  到期: {membershipInfo.expiryDate.toLocaleDateString('zh-CN')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
