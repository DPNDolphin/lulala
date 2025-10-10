'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'
import { fetchMarketData, type MarketData } from '@/lib/coinGeckoApi'

interface ExtendedMarketData extends MarketData {
  priceFormatted: string
  changeFormatted: string
  volumeFormatted: string
}

export default function MarketStats() {
  const [marketData, setMarketData] = useState<ExtendedMarketData[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 获取市场数据
  const loadMarketData = async () => {
    try {
      setIsRefreshing(true)
      const data = await fetchMarketData()
      
      // 添加格式化字段
      const formattedData: ExtendedMarketData[] = data.map(item => ({
        ...item,
        priceFormatted: formatPrice(item.price),
        changeFormatted: Math.abs(item.change).toFixed(2),
        volumeFormatted: formatVolume(item.volume)
      }))
      
      setMarketData(formattedData)
      setLastUpdated(new Date())
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load market data:', error)
      setIsLoading(false)
    } finally {
      setIsRefreshing(false)
    }
  }

  // 格式化价格
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0 
      })}`
    } else if (price >= 1) {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      })}`
    } else {
      return `$${price.toLocaleString('en-US', { 
        minimumFractionDigits: 4,
        maximumFractionDigits: 4 
      })}`
    }
  }

  // 格式化交易量
  const formatVolume = (volume: number): string => {
    if (volume >= 1e9) {
      return `$${(volume / 1e9).toFixed(1)}B`
    } else if (volume >= 1e6) {
      return `$${(volume / 1e6).toFixed(1)}M`
    } else if (volume >= 1e3) {
      return `$${(volume / 1e3).toFixed(1)}K`
    } else {
      return `$${volume.toFixed(0)}`
    }
  }

  // 初始加载数据
  useEffect(() => {
    loadMarketData()
  }, [])

  // 移动端轮播
  useEffect(() => {
    if (marketData.length === 0) return
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % marketData.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [marketData.length])

  return (
    <section className="py-12 border-y border-gray-800 bg-background-secondary/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-text-primary">实时市场数据</h2>
            <button
              onClick={loadMarketData}
              disabled={isRefreshing}
              className="p-2 hover:bg-background-card rounded-lg transition-colors disabled:opacity-50"
              title="刷新数据"
            >
              <RefreshCcw className={`h-4 w-4 text-text-muted ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-center gap-2 text-text-muted">
            <span>主要加密货币价格动态</span>
            {lastUpdated && (
              <span className="text-xs">
                • 更新于 {lastUpdated.toLocaleTimeString('zh-CN')}
              </span>
            )}
          </div>
        </div>
        
        {isLoading ? (
          // 加载状态
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCcw className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-text-muted">加载市场数据中...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:grid grid-cols-5 gap-6">
          {marketData.map((coin, index) => (
            <div key={index} className="bg-background-card rounded-lg p-4 hover-glow transition-all">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                    {coin.image ? (
                      <img 
                        src={coin.image} 
                        alt={coin.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // 图标加载失败时显示首字母
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-primary font-bold text-sm">${coin.symbol.charAt(0)}</span>`;
                            parent.className = 'w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center';
                          }
                        }}
                      />
                    ) : (
                      <span className="text-primary font-bold text-sm">{coin.symbol.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-text-primary text-sm">{coin.symbol}</div>
                    <div className="text-text-muted text-xs">{coin.name}</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="font-bold text-text-primary">{coin.priceFormatted}</div>
                <div className={`flex items-center space-x-1 text-sm ${
                  coin.change >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {coin.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{coin.changeFormatted}%</span>
                </div>
                <div className="text-text-muted text-xs">24h Vol: {coin.volumeFormatted}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View - Sliding Cards */}
        <div className="md:hidden">
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {marketData.map((coin, index) => (
                <div key={index} className="w-full flex-shrink-0 px-2">
                  <div className="bg-background-card rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-100">
                          {coin.image ? (
                            <img 
                              src={coin.image} 
                              alt={coin.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // 图标加载失败时显示首字母
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<span class="text-primary font-bold">${coin.symbol.charAt(0)}</span>`;
                                  parent.className = 'w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center';
                                }
                              }}
                            />
                          ) : (
                            <span className="text-primary font-bold">{coin.symbol.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-text-primary">{coin.symbol}</div>
                          <div className="text-text-muted text-sm">{coin.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-text-primary">{coin.priceFormatted}</div>
                        <div className={`flex items-center space-x-1 text-sm ${
                          coin.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {coin.change >= 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          <span>{coin.changeFormatted}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-text-muted text-sm">24h交易量: {coin.volumeFormatted}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Mobile Indicators */}
          <div className="flex justify-center mt-4 space-x-2">
            {marketData.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex ? 'bg-primary' : 'bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  )
}
