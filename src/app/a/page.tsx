'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Calendar, Clock, Rocket, BarChart3 } from 'lucide-react'
// 移除 Booster 相关组件
import AirdropCard from '@/components/AirdropCard'
import StabilityBoard from '@/components/StabilityBoard'
import { publicAPI } from '@/lib/publicAPI'
import ResearchDetailModal from '@/components/ResearchDetailModal'

// 移除 AlphaTask/Comment 类型（Booster 专用）

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

interface AirdropsResponse {
  api_code: number
  api_msg: string
  airdrop_today: AirdropData[]
  airdrop_preview: AirdropData[]
}

export default function AlphaPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'alpha' | 'stability'>('alpha')
  
  // 空投数据状态
  const [airdropToday, setAirdropToday] = useState<AirdropData[]>([])
  const [airdropPreview, setAirdropPreview] = useState<AirdropData[]>([])
  const [airdropLoading, setAirdropLoading] = useState(false)




  useEffect(() => {
    setMounted(true)
    // 初次加载空投数据
    loadAirdrops()
  }, [])

  // 切换 Tab 时重新加载数据
  useEffect(() => {
    if (activeTab === 'alpha') {
      loadAirdrops()
    }
    // 稳定度看板数据由组件自己加载
  }, [activeTab])

  // 通过 URL 参数自动打开详情弹窗，例如 /alpha?id=123
  // 移除通过 URL 打开 Booster 详情逻辑

  // 加载空投数据
  const loadAirdrops = async () => {
    console.log('开始加载空投数据')
    
    setAirdropLoading(true)
    try {
      const response = await publicAPI.get('/v1/research/airdrops')
      const data = response as AirdropsResponse
      
      console.log('空投API响应:', data)
      
      if (data.api_code == 200) {
        setAirdropToday(data.airdrop_today || [])
        setAirdropPreview(data.airdrop_preview || [])
        console.log('空投数据加载成功，今日:', data.airdrop_today?.length || 0, '预告:', data.airdrop_preview?.length || 0)
      } else {
        console.error('空投API返回错误:', data.api_msg)
      }
    } catch (error) {
      console.error('加载空投数据失败:', error)
    } finally {
      setAirdropLoading(false)
    }
  }

  // 移除 Booster 列表加载逻辑

  // 移除 Booster 详情逻辑

  // 移除 Booster 评论逻辑

  // 过滤任务
  // 移除 Booster 列表过滤

  // 防止水合错误
  if (!mounted) {
    return (
      <div className="min-h-screen relative">
        {/* 固定背景图片 */}
        <div 
          className="fixed inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url(/alpha_bg.png)',
            zIndex: -1
          }}
        />
        
      
        <div className="relative z-10 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }



  return (
    <div className="min-h-screen relative">
      {/* 固定背景图片 */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/alpha_bg.png)',
          zIndex: -1
        }}
      />
      
 
      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="h-8 w-8 text-pink-400" />
              <h1 className="text-3xl font-bold text-white">币安Alpha专区</h1>
            </div>
            <p className="text-gray-300">
              发现最新的Alpha任务和Booster教程，把握早期机会
            </p>
          </div>

          {/* Tab导航（移除 Booster） */}
          <div className="flex space-x-1 bg-black/30 backdrop-blur-sm border border-gray-700/50 rounded-xl p-1 mb-8">
            <button
              onClick={() => setActiveTab('alpha')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'alpha'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Rocket className="h-4 w-4" />
              <span>币安Alpha预告</span>
            </button>
            <button
              onClick={() => setActiveTab('stability')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'stability'
                  ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 border border-pink-400/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>度看板</span>
            </button>
          </div>

          {/* 内容区域 */}
          <>
            {activeTab === 'stability' && (
              <StabilityBoard />
            )}

            {activeTab === 'alpha' && (
              <>
                {/* 今日空投 */}
                <div className="mb-8">
                  <div className="flex items-center space-x-3 mb-6">
                    <Calendar className="h-6 w-6 text-pink-400" />
                    <h2 className="text-2xl font-bold text-white">今日空投</h2>
                    <div className="bg-pink-400/20 text-pink-400 px-3 py-1 rounded-full text-sm font-medium">
                      {airdropToday.length} 个
                    </div>
                  </div>
                  
                  {airdropLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : airdropToday.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {airdropToday.map((airdrop) => (
                        <AirdropCard
                          key={airdrop.id}
                          airdrop={{
                            ...airdrop,
                            name: airdrop.name && airdrop.name.trim() ? airdrop.name : 'Token名未揭晓',
                          }}
                          isToday={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700/50">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">今日暂无空投活动</p>
                    </div>
                  )}
                </div>

                {/* 空投预告 */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <Clock className="h-6 w-6 text-purple-400" />
                      <h2 className="text-2xl font-bold text-white">空投预告</h2>
                      <div className="bg-purple-400/20 text-purple-400 px-3 py-1 rounded-full text-sm font-medium">
                        {airdropPreview.length} 个
                      </div>
                    </div>
                  </div>
                  
                  {airdropLoading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                          <div className="h-4 bg-gray-700 rounded mb-4"></div>
                          <div className="h-3 bg-gray-700 rounded mb-2"></div>
                          <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                        </div>
                      ))}
                    </div>
                  ) : airdropPreview.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {airdropPreview.map((airdrop) => (
                        <AirdropCard
                          key={airdrop.id}
                          airdrop={{
                            ...airdrop,
                            name: airdrop.name && airdrop.name.trim() ? airdrop.name : 'Token名未揭晓',
                          }}
                          isToday={false}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-black/20 backdrop-blur-sm rounded-xl border border-gray-700/50">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300">暂无空投预告</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 已移除 Booster 区块 */}
          </>

        {/* 已移除 Booster 详情弹窗 */}

        </div>
      </div>
    </div>
  )
}
