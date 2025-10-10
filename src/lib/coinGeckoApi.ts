// CoinGecko API 服务

export interface CoinGeckoData {
  [key: string]: {
    usd: number
    usd_24h_vol: number
    usd_24h_change: number
  }
}

export interface MarketData {
  id: string
  name: string
  symbol: string
  price: number
  change: number
  volume: number
  image?: string
}

// 币种映射配置
const COIN_CONFIG = {
  bitcoin: { 
    name: '比特币', 
    symbol: 'BTC',
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  ethereum: { 
    name: '以太坊', 
    symbol: 'ETH',
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  },
  binancecoin: { 
    name: 'BNB', 
    symbol: 'BNB',
    image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
  },
  solana: { 
    name: 'Solana', 
    symbol: 'SOL',
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  cardano: { 
    name: 'Cardano', 
    symbol: 'ADA',
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
  }
}

// 格式化价格显示
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

// 格式化交易量显示
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

// 获取市场数据
export async function fetchMarketData(): Promise<MarketData[]> {
  try {
    const coinIds = Object.keys(COIN_CONFIG).join(',')
    const url = `/v1/global/price?coinIds=${coinIds}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // 添加缓存控制，避免过于频繁的请求
      next: { revalidate: 30 } // 30秒缓存
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: CoinGeckoData = await response.json()

    // 转换数据格式
    const marketData: MarketData[] = Object.entries(data).map(([coinId, coinData]) => {
      const config = COIN_CONFIG[coinId as keyof typeof COIN_CONFIG]
      
      return {
        id: coinId,
        name: config.name,
        symbol: config.symbol,
        price: coinData.usd,
        change: coinData.usd_24h_change,
        volume: coinData.usd_24h_vol,
        image: config.image,
        // 添加格式化的显示字段
        priceFormatted: formatPrice(coinData.usd),
        changeFormatted: Math.abs(coinData.usd_24h_change).toFixed(2),
        volumeFormatted: formatVolume(coinData.usd_24h_vol)
      } as MarketData & {
        priceFormatted: string
        changeFormatted: string
        volumeFormatted: string
      }
    })

    // 按预定义顺序排序
    const orderedCoins = ['bitcoin', 'ethereum', 'binancecoin', 'solana', 'cardano']
    return marketData.sort((a, b) => orderedCoins.indexOf(a.id) - orderedCoins.indexOf(b.id))

  } catch (error) {
    console.error('Error fetching market data:', error)
    
    // 返回默认数据作为后备
    return [
      {
        id: 'bitcoin',
        name: '比特币',
        symbol: 'BTC',
        price: 45000,
        change: 2.34,
        volume: 28500000000,
        image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
      },
      {
        id: 'ethereum',
        name: '以太坊',
        symbol: 'ETH',
        price: 2891,
        change: -1.23,
        volume: 15200000000,
        image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
      },
      {
        id: 'binancecoin',
        name: 'BNB',
        symbol: 'BNB',
        price: 315,
        change: 0.87,
        volume: 890000000,
        image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png'
      },
      {
        id: 'solana',
        name: 'Solana',
        symbol: 'SOL',
        price: 89,
        change: 4.56,
        volume: 2100000000,
        image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
      },
      {
        id: 'cardano',
        name: 'Cardano',
        symbol: 'ADA',
        price: 0.45,
        change: -2.11,
        volume: 356000000,
        image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
      }
    ]
  }
}
