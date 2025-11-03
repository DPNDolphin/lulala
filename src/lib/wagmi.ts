import { createConfig, http } from 'wagmi'
import { mainnet, sepolia, arbitrum, base, optimism, polygon, bsc } from 'wagmi/chains'
import { 
  injected, 
  walletConnect, 
  coinbaseWallet,
  metaMask
} from 'wagmi/connectors'

// 配置支持的区块链网络（移除 Tron，因为它不是 EVM 兼容链）
const chains = [mainnet, bsc, polygon, arbitrum, optimism, base, sepolia] as const

// 创建wagmi配置
const wcProjectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID

const baseConnectors = [
  // 通用注入式连接器，支持 MetaMask / OKX / Binance / TokenPocket / Trust 等
  injected(),
  
  // Coinbase Wallet
  coinbaseWallet({
    appName: 'Lulala',
    appLogoUrl: 'https://www.lulala.ai/logo.png',
  }),
] as const

const connectors = [
  ...baseConnectors,
  // 仅当存在有效 WalletConnect ProjectId 时才启用
  ...(wcProjectId
    ? [
        walletConnect({
          projectId: wcProjectId,
          metadata: {
            name: 'Lulala',
            description: 'Lulala Labs DApp',
            url: 'https://www.lulala.ai',
            icons: ['https://www.lulala.ai/logo.png'],
          },
          // 默认内置二维码模态即可，不额外开启自定义
        }),
      ]
    : []),
] as any

export const wagmiConfig = createConfig({
  chains,
  connectors,
  transports: {
    [mainnet.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [sepolia.id]: http(),
  },
  // 添加错误处理配置
  batch: {
    multicall: {
      batchSize: 1024,
      wait: 16,
    },
  },
})

// 导出类型
export type Config = typeof wagmiConfig

declare module 'wagmi' {
  interface Register {
    config: Config
  }
}
