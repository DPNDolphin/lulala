'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract, useConnect, useDisconnect } from 'wagmi'
import { parseUnits } from 'viem'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import {
  Crown,
  Check,
  Copy,
  ExternalLink,
  AlertCircle,
  Coins,
  Shield,
  Star,
  Zap,
  Users,
  FileText,
  ArrowUpRight,
  Loader2,
  Wallet,
  X
} from 'lucide-react'

// USDT合约地址配置
const USDT_CONTRACTS = {
  1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // Ethereum USDT
  56: '0x55d398326f99059fF775485246999027B3197955', // BSC USDT 
  137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // Polygon USDT
  42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
  10: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Optimism USDT
}

// 链信息配置
const CHAIN_INFO = {
  1: { name: 'Ethereum', explorer: 'https://etherscan.io' },
  56: { name: 'BSC', explorer: 'https://bscscan.com' },
  137: { name: 'Polygon', explorer: 'https://polygonscan.com' },
  42161: { name: 'Arbitrum', explorer: 'https://arbiscan.io' },
  10: { name: 'Optimism', explorer: 'https://optimistic.etherscan.io' },
}

// 链ID到配置键的映射
const CHAIN_ID_TO_CONFIG_KEY = {
  1: 'ethereum',
  56: 'bsc', 
  137: 'polygon',
  42161: 'arbitrum',
  10: 'optimism'
} as const

// USDT合约ABI - 包含transfer、balanceOf和decimals
const USDT_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'account', type: 'address' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const

export default function SubscriptionPage() {
  const { address, isConnected, chain } = useAccount()
  const { isAuthenticated, user, loading: authLoading, refreshAuth } = useMultiAuth()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const [copied, setCopied] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [transferStep, setTransferStep] = useState<'idle' | 'checking' | 'transferring' | 'success' | 'activating' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isConnectingWallet, setIsConnectingWallet] = useState(false)
  const [showWalletModal, setShowWalletModal] = useState(false)
  const [walletMessage, setWalletMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [paymentConfig, setPaymentConfig] = useState<{
    ethereum: string
    bsc: string
    polygon: string
    arbitrum: string
    optimism: string
  } | null>(null)
  const [vipConfig, setVipConfig] = useState<{
    price: string
    duration: string
  } | null>(null)
  const [tradeConfig, setTradeConfig] = useState<{
    price: string
    duration: string
  } | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const searchParams = useSearchParams()
  const [selectedSubscriptionType, setSelectedSubscriptionType] = useState<'vip' | 'trade'>('vip')

  // 处理URL参数，自动选中订阅类型
  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'trading') {
      setSelectedSubscriptionType('trade')
    }
  }, [searchParams])

  // 转账相关状态
  const { writeContract, isPending: isTransferPending, data: hash, error: writeError } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed, error: txError } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 加载支付配置
  const loadPaymentConfig = async () => {
    try {
      setLoadingConfig(true)
      const response = await fetch('/v1/global/config')
      const data = await response.json()
      
      if (data.api_code == 200) {
        setPaymentConfig({
          ethereum: data.payment_address_ethereum || '',
          bsc: data.payment_address_bsc || '',
          polygon: data.payment_address_polygon || '',
          arbitrum: data.payment_address_arbitrum || '',
          optimism: data.payment_address_optimism || ''
        })
        setVipConfig({
          price: data.vip_price || '300',
          duration: data.vip_duration || '12个月'
        })
        setTradeConfig({
          price: data.trade_price || '300',
          duration: data.trade_duration || '12个月'
        })
      }
    } catch (error) {
      console.error('加载支付配置失败:', error)
    } finally {
      setLoadingConfig(false)
    }
  }

  useEffect(() => {
    if (isClient) {
      loadPaymentConfig()
    }
  }, [isClient])

  // 监控链变化的调试信息
  useEffect(() => {
    if (isClient) {
      console.log('🔄 链状态变化:')
      console.log('isConnected:', isConnected)
      console.log('chain对象:', chain)
      console.log('chain?.id:', chain?.id)
      console.log('chain?.name:', chain?.name)
      console.log('address:', address)
    }
  }, [isClient, isConnected, chain, address])

  // 监控交易状态
  useEffect(() => {
    if (writeError) {
      console.error('💥 写入合约错误:', writeError)
      setTransferStep('error')
      setErrorMessage('交易失败: ' + writeError.message)
    }
  }, [writeError])

  useEffect(() => {
    if (txError) {
      console.error('💥 交易错误:', txError)
      setTransferStep('error')
      setErrorMessage('交易确认失败: ' + txError.message)
    }
  }, [txError])

  useEffect(() => {
    if (isConfirmed) {
      console.log('✅ 交易确认成功')
      setTransferStep('success')
      setErrorMessage('')
      
      // 调用订阅接口激活会员权益
      activateSubscription()
    }
  }, [isConfirmed])

  // 清除钱包消息
  const clearWalletMessage = () => setWalletMessage(null)

  // 显示钱包消息
  const showWalletMessage = (type: 'error' | 'success', text: string) => {
    setWalletMessage({ type, text })
    setTimeout(clearWalletMessage, 5000)
  }

  // 激活订阅
  const activateSubscription = async () => {
    if (!hash || !chain?.id) {
      console.error('缺少交易hash或链ID')
      setErrorMessage('激活会员权益失败：缺少必要信息')
      return
    }

    try {
      const subscriptionType = selectedSubscriptionType
      const apiEndpoint = subscriptionType === 'vip' ? '/v1/users/vipsub' : '/v1/users/tradesub'
      const subscriptionName = subscriptionType === 'vip' ? 'VIP会员' : '交易会员'
      
      console.log(`🔄 开始激活${subscriptionName}订阅...`)
      console.log('交易hash:', hash)
      console.log('链ID:', chain.id)
      
      setTransferStep('activating')
      setErrorMessage('')

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hash: hash,
          chainid: chain.id
        })
      })

      const data = await response.json()
      
      if (data.api_code == 200) {
        console.log(`✅ ${subscriptionName}订阅激活成功`)
        setTransferStep('success')
        setErrorMessage('')
        showWalletMessage('success', `${subscriptionName}权益激活成功！`)
        
        // 刷新用户状态以更新左侧菜单的会员信息
        try {
          await refreshAuth()
          console.log('🔄 用户状态已刷新，会员信息已更新')
        } catch (error) {
          console.error('刷新用户状态失败:', error)
          // 即使刷新失败也不影响主要流程
        }
      } else {
        console.error(`❌ ${subscriptionName}订阅激活失败:`, data.api_msg)
        setErrorMessage(`激活${subscriptionName}权益失败：` + data.api_msg)
        setTransferStep('error')
      }
    } catch (error) {
      console.error('❌ 激活订阅时发生错误:', error)
      setErrorMessage('激活会员权益失败：网络错误')
      setTransferStep('error')
    }
  }

  // 检测是否为移动端
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768

  // 检测移动端DApp浏览器环境
  const detectMobileDAppBrowser = () => {
    if (typeof window === 'undefined') return null
    
    const userAgent = navigator.userAgent.toLowerCase()
    const win = window as any
    
    // 检测具体的DApp浏览器
    if (userAgent.includes('okx')) {
      return { type: 'okx', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('tokenpocket')) {
      return { type: 'tokenpocket', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('metamask')) {
      return { type: 'metamask', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('coinbase')) {
      return { type: 'coinbase', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('trust')) {
      return { type: 'trust', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('imtoken')) {
      return { type: 'imtoken', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('bitget')) {
      return { type: 'bitget', hasEthereum: !!win.ethereum }
    } else if (userAgent.includes('binance')) {
      return { type: 'binance', hasEthereum: !!win.ethereum }
    }
    
    // 通用DApp浏览器检测
    if (win.ethereum && win.ethereum.isConnected && win.ethereum.isConnected()) {
      return { type: 'generic', hasEthereum: true }
    }
    
    return null
  }

  // 检查钱包是否已安装的辅助函数
  const isWalletInstalled = (walletName: string): boolean => {
    if (typeof window === 'undefined') return false
    
    const win = window as any
    
    // 移动端DApp浏览器检测
    const isMobileDAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      return (
        userAgent.includes('okx') ||
        userAgent.includes('tokenpocket') ||
        userAgent.includes('metamask') ||
        userAgent.includes('trust') ||
        userAgent.includes('imtoken') ||
        userAgent.includes('bitget') ||
        userAgent.includes('coinbase') ||
        userAgent.includes('binance') ||
        // 检测是否为DApp浏览器环境
        (win.ethereum && win.ethereum.isConnected && win.ethereum.isConnected())
      )
    }
    
    switch (walletName.toLowerCase()) {
      case 'metamask':
        return !!(win.ethereum?.isMetaMask || (isMobile && isMobileDAppBrowser()))
      case 'okx wallet':
        return !!(win.okxwallet || win.ethereum?.isOkxWallet || (isMobile && isMobileDAppBrowser()))
      case 'binance wallet':
        return !!(win.binancew3w || (isMobile && isMobileDAppBrowser()))
      case 'coinbase wallet':
        return !!(win.CoinbaseWalletProvider || (isMobile && isMobileDAppBrowser()))
      case 'tokenpocket':
        return !!(win.tokenpocket || win.ethereum?.isTokenPocket || (isMobile && isMobileDAppBrowser()))
      case 'walletconnect':
        return true
      default:
        return false
    }
  }

  // 获取钱包图标
  const getWalletIcon = (connectorName: string) => {
    switch (connectorName.toLowerCase()) {
      case 'metamask':
        return '/metamask.svg'
      case 'okxwallet':
        return '/okx.svg'
      case 'okx wallet':
        return '/okx.svg'
      case 'binance wallet':
        return '/binance.svg'
      case 'walletconnect':
        return '/walletconnect.svg'
      case 'coinbase wallet':
        return '/coinbase.svg'
      case 'tokenpocket':
        return '/tokenpocket.svg'
      default:
        return '/okx.svg'
    }
  }

  // 固定顺序展示所需映射到实际 connector
  const getConnectorForDisplay = (displayName: string) => {
    const lower = displayName.toLowerCase()
    return connectors.find(c => c.name.toLowerCase().includes(lower))
  }

  // 钱包连接处理函数
  const handleWalletConnect = useCallback(async (connector?: any) => {
    if (isConnectingWallet) return
    
    try {
      setIsConnectingWallet(true)
      setErrorMessage('')
      clearWalletMessage()
      
      let targetConnector = connector
      
      // 如果没有指定connector，选择合适的
      if (!targetConnector) {
        console.log('🔍 开始选择connector...')
        
        // 移动端：使用 injected connector
        if (isMobile) {
          targetConnector = connectors.find(c => 
            c.type === 'injected' || c.name.toLowerCase().includes('injected')
          )
          console.log('📱 移动端选择 injected connector:', targetConnector?.name)
        } else {
          // 桌面端：优先选择MetaMask connector
          const metaMaskConnector = connectors.find(c => 
            c.name.toLowerCase().includes('metamask')
          )
          
          if (metaMaskConnector) {
            targetConnector = metaMaskConnector
          } else {
            // 选择第一个可用的connector
            const availableConnectors = connectors.filter(c => isWalletInstalled(c.name))
            if (availableConnectors.length > 0) {
              targetConnector = availableConnectors[0]
            }
          }
        }
      }
      
      if (!targetConnector) {
        showWalletMessage('error', '未找到可用的钱包连接器')
        return
      }
      
      console.log('✅ 开始连接钱包:', targetConnector.name)
      await connect({ connector: targetConnector })
      
      // 连接成功后关闭弹窗
      setShowWalletModal(false)
      showWalletMessage('success', '钱包连接成功')
      
    } catch (error: any) {
      console.error('钱包连接失败:', error)
      const code = error?.code ?? error?.cause?.code
      const message: string = error?.message || ''
      
      if (code === 4001 || /user rejected/i.test(message)) {
        showWalletMessage('error', '用户取消了钱包连接')
      } else {
        showWalletMessage('error', '钱包连接失败: ' + (error.message || '未知错误'))
      }
    } finally {
      setIsConnectingWallet(false)
    }
  }, [connectors, connect, isConnectingWallet, isMobile])

  // 钱包断开连接
  const handleWalletDisconnect = useCallback(async () => {
    try {
      await disconnect()
      setErrorMessage('')
    } catch (error) {
      console.error('断开钱包连接失败:', error)
      setErrorMessage('断开钱包连接失败')
    }
  }, [disconnect])

  // 会员配置
  const getMembershipPlan = (type: 'vip' | 'trade') => {
    const config = type === 'vip' ? vipConfig : tradeConfig
    return {
      name: type === 'vip' ? 'Lulala Labs VIP会员' : 'Lulala Labs 交易会员',
      priceInUSDT: config?.price || '300',
      duration: config?.duration || '12个月',
      features: type === 'vip' ? [
        '专业投研报告',
        '实时市场数据',
        '专属社区交流',
        '优先客服支持'
      ] : [
        '专业交易策略',
        '实时交易信号',
        '交易工具使用',
        '交易指导服务'
      ]
    }
  }

  const membershipPlan = getMembershipPlan(selectedSubscriptionType)

  // 获取当前链的信息
  const getCurrentChainInfo = () => {
    // 调试信息
    console.log('🔍 调试信息:')
    console.log('当前链ID:', chain?.id)
    console.log('链信息配置:', CHAIN_INFO)
    console.log('USDT合约配置:', USDT_CONTRACTS)
    console.log('支付配置:', paymentConfig)

    if (!chain?.id) {
      console.log('❌ 链ID不存在')
      return null
    }

    if (!CHAIN_INFO[chain.id as keyof typeof CHAIN_INFO]) {
      console.log('❌ 链ID不在支持列表中:', chain.id)
      console.log('支持的链ID:', Object.keys(CHAIN_INFO))
      return null
    }

    const usdtContract = USDT_CONTRACTS[chain.id as keyof typeof USDT_CONTRACTS]
    if (!usdtContract) {
      console.log('❌ USDT合约不存在:', chain.id)
      return null
    }

    // 检查是否配置了收款地址
    const configKey = CHAIN_ID_TO_CONFIG_KEY[chain.id as keyof typeof CHAIN_ID_TO_CONFIG_KEY]
    const paymentAddress = paymentConfig?.[configKey as keyof typeof paymentConfig]
    
    if (!paymentAddress || paymentAddress.trim() === '') {
      console.log('❌ 收款地址未配置:', chain.id, configKey)
      return null
    }

    const info = {
      chainId: chain.id,
      name: CHAIN_INFO[chain.id as keyof typeof CHAIN_INFO].name,
      usdtContract: usdtContract,
      paymentAddress: paymentAddress,
      explorer: CHAIN_INFO[chain.id as keyof typeof CHAIN_INFO].explorer
    }

    console.log('✅ 链信息获取成功:', info)
    return info
  }

  const chainInfo = getCurrentChainInfo()

  // 获取USDT余额
  const { data: usdtBalance } = useReadContract({
    address: chainInfo?.usdtContract as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: !!chainInfo?.usdtContract && !!address,
    },
  })

  // 动态获取USDT的decimals
  const { data: usdtDecimals } = useReadContract({
    address: chainInfo?.usdtContract as `0x${string}`,
    abi: USDT_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!chainInfo?.usdtContract,
    },
  })

  // 根据动态获取的decimals计算所需金额
  const requiredAmount = usdtDecimals ? parseUnits(membershipPlan.priceInUSDT, usdtDecimals) : BigInt(0)
  const hasEnoughBalance = usdtBalance && usdtDecimals ? usdtBalance >= requiredAmount : false

  // 调试日志
  console.log('🔍 支付按钮调试信息:', {
    usdtBalance: usdtBalance?.toString(),
    usdtDecimals,
    requiredAmount: requiredAmount.toString(),
    hasEnoughBalance,
    transferStep,
    membershipPlanPrice: membershipPlan.priceInUSDT,
    currentBalance: usdtBalance && usdtDecimals ? (Number(usdtBalance) / Math.pow(10, usdtDecimals)).toFixed(2) : '0'
  })

  // 复制地址到剪贴板
  const copyAddress = async () => {
    if (!chainInfo?.paymentAddress) return
    try {
      await navigator.clipboard.writeText(chainInfo.paymentAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 发起USDT转账 - 直接转账，无需授权
  const handleUSDTTransfer = async () => {
    if (!chainInfo || !address) return

    console.log('💳 开始USDT支付...')
    console.log('余额充足:', hasEnoughBalance)

    setTransferStep('checking')
    setErrorMessage('')

    // 检查余额
    if (!hasEnoughBalance) {
      setTransferStep('error')
      const currentBalance = usdtBalance && usdtDecimals ?
        (Number(usdtBalance) / Math.pow(10, usdtDecimals)).toFixed(2) : '0'
      setErrorMessage(`USDT余额不足。需要 ${membershipPlan.priceInUSDT} USDT，当前余额: ${currentBalance} USDT`)
      return
    }

    try {
      setTransferStep('transferring')
      setErrorMessage('')

      console.log('💸 开始转账...')
      console.log('合约地址:', chainInfo.usdtContract)
      console.log('接收地址:', chainInfo.paymentAddress)
      console.log('转账金额:', requiredAmount.toString())

      writeContract({
        address: chainInfo.usdtContract as `0x${string}`,
        abi: USDT_ABI,
        functionName: 'transfer',
        args: [chainInfo.paymentAddress as `0x${string}`, requiredAmount],
      })
    } catch (error) {
      console.error('转账失败:', error)
      setTransferStep('error')
      setErrorMessage('转账失败: ' + (error as Error).message)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* 页面头部 */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Crown className="h-12 w-12 text-pink-400 mr-3" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-400 to-pink-600 bg-clip-text text-transparent">
              会员订阅
            </h1>
          </div>
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl font-bold text-pink-400 mb-6">
              成为我们的会员，一起抢占Web3财富先机！
            </p>
            <div className="text-left bg-background-card rounded-xl p-6 mb-6 border border-pink-400/20">
              <p className="text-lg text-text-primary mb-4">你是否也在寻找：</p>
              <div className="space-y-3 text-text-primary">
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>即将上线币安Binance/Coinbase的潜力项目？</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>第一时间参与空投测试机会？</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>有人手把手教你怎么玩，不再迷茫？</span>
                </div>
                <div className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>不再错过每一个可能暴富的时刻？</span>
                </div>
              </div>
              <p className="text-xl font-bold text-pink-400 mt-6 text-center">
                加入我们，下一轮Web3红利分你一杯羹！
              </p>
            </div>
          </div>
        </div>



        {/* 订阅类型选择 */}
        <div className="bg-background-card rounded-2xl p-6 border border-gray-700 mb-6">
          <h2 className="text-2xl font-bold text-text-primary mb-6 text-center">选择订阅类型</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VIP会员选项 */}
            <div 
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSubscriptionType === 'vip' 
                  ? 'border-pink-400 bg-pink-400/10' 
                  : 'border-gray-600 hover:border-pink-400/50'
              }`}
              onClick={() => setSelectedSubscriptionType('vip')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Crown className="h-6 w-6 text-pink-400" />
                  <h3 className="text-xl font-bold text-text-primary">VIP会员</h3>
                </div>
                {selectedSubscriptionType === 'vip' && (
                  <Check className="h-6 w-6 text-pink-400" />
                )}
              </div>
              <p className="text-text-secondary mb-4">
                专业投研服务，深度市场分析和项目评估
              </p>
              <div className="text-2xl font-bold text-pink-400">
                {vipConfig?.price || '300'} USDT
              </div>
              <div className="text-sm text-text-muted">
                {vipConfig?.duration || '12个月'}
              </div>
            </div>

            {/* 交易会员选项 */}
            <div 
              className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSubscriptionType === 'trade' 
                  ? 'border-blue-400 bg-blue-400/10' 
                  : 'border-gray-600 hover:border-blue-400/50'
              }`}
              onClick={() => setSelectedSubscriptionType('trade')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Zap className="h-6 w-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-text-primary">交易会员</h3>
                </div>
                {selectedSubscriptionType === 'trade' && (
                  <Check className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <p className="text-text-secondary mb-4">
                专业交易服务，实时交易信号和策略指导
              </p>
              <div className="text-2xl font-bold text-blue-400">
                {tradeConfig?.price || '300'} USDT
              </div>
              <div className="text-sm text-text-muted">
                {tradeConfig?.duration || '12个月'}
              </div>
            </div>
          </div>
        </div>

        {/* 会员方案 */}
        <div className={`bg-background-card rounded-2xl p-8 border-2 bg-gradient-to-br mb-8 ${
          selectedSubscriptionType === 'vip' 
            ? 'border-pink-400/30 from-pink-400/5 to-transparent' 
            : 'border-blue-400/30 from-blue-400/5 to-transparent'
        }`}>
          <div className="text-center mb-8">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
              selectedSubscriptionType === 'vip' 
                ? 'bg-pink-400/20' 
                : 'bg-blue-400/20'
            }`}>
              {selectedSubscriptionType === 'vip' ? (
                <Crown className="h-8 w-8 text-pink-400" />
              ) : (
                <Zap className="h-8 w-8 text-blue-400" />
              )}
            </div>
            <h2 className={`text-3xl font-bold mb-2 ${
              selectedSubscriptionType === 'vip' 
                ? 'text-pink-400' 
                : 'text-blue-400'
            }`}>
              {membershipPlan.name}
            </h2>
            <div className="mb-4">
              <span className={`text-4xl font-bold ${
                selectedSubscriptionType === 'vip' 
                  ? 'text-pink-400' 
                  : 'text-blue-400'
              }`}>
                {membershipPlan.priceInUSDT} USDT
              </span>
              <span className="text-text-muted text-lg">/{membershipPlan.duration}</span>
            </div>
          </div>

          {/* 功能列表 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {membershipPlan.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                  selectedSubscriptionType === 'vip' 
                    ? 'text-pink-400' 
                    : 'text-blue-400'
                }`} />
                <span className="text-text-primary leading-relaxed">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>
        {/* 我们是谁 */}
        <div className="bg-background-card rounded-2xl p-8 border border-blue-400/30 bg-gradient-to-br from-blue-400/5 to-transparent mb-8">
          <h2 className="text-2xl font-bold text-blue-400 mb-6 text-center">我们是谁？</h2>
          <div className="space-y-4 text-text-primary">
            <p className="text-lg">
              我们是<span className="font-bold text-blue-400">【Lulala Labs】</span>——一家专注于全球一级市场项目的Web3投研平台。
            </p>
            <p className="text-lg">
              我们只研究<span className="font-bold text-pink-400">被全球正规VC孵化、有望上线币安/Coinbase的项目</span>。
            </p>
            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-4 mt-6">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="h-5 w-5 text-red-400" />
                <span className="font-bold text-red-400">我们的承诺</span>
              </div>
              <div className="space-y-2 text-text-primary">
                <p>我们<span className="font-bold text-red-400">不是喊单</span>，我们<span className="font-bold text-red-400">不画饼</span>。</p>
                <p>我们只用<span className="font-bold text-green-400">数据和逻辑</span>，带你提前发现未来的明星项目！</p>
              </div>
            </div>
          </div>
        </div>


        {/* 付款信息 */}
        {isClient && (
          <div className="bg-background-secondary rounded-2xl p-8 border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <Coins className="h-6 w-6 text-amber-400 mr-3" />
              付款信息
            </h2>

            {/* 未登录用户提示 */}
            {!isAuthenticated && !authLoading && (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="h-12 w-12 text-amber-400" />
                </div>
                <h3 className="text-2xl font-bold text-amber-400 mb-4">
                  请先登录
                </h3>
                <p className="text-text-secondary text-lg mb-6">
                  您需要先登录才能查看付款方式和订阅服务
                </p>
                <div className="text-text-primary">
                  <p className="mb-2">登录后您将可以：</p>
                  <div className="space-y-2 text-left max-w-md mx-auto">
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>使用USDT直接支付订阅费用</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>享受会员专享权益</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Check className="h-4 w-4 text-green-400 flex-shrink-0" />
                      <span>获得专业投研服务</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 已登录用户显示付款信息 */}
            {isAuthenticated && (
              <>
                {/* 钱包连接和链检测 */}
            {!isConnected ? (
              <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-amber-400 mb-2">
                      请连接钱包进行支付
                    </h3>
                    <p className="text-text-secondary mb-4">
                      连接您的Web3钱包以使用USDT直接支付订阅费用
                    </p>
                    <button
                      onClick={() => setShowWalletModal(true)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white py-2 px-4 rounded-lg font-medium transition-all flex items-center space-x-2"
                    >
                      <Coins className="h-4 w-4" />
                      <span>连接钱包</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : !chainInfo ? (
              <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-6 mb-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                      当前网络不支持支付
                    </h3>
                    <p className="text-text-secondary mb-2">
                      当前网络未配置收款地址或不在支持列表中，请切换至以下已配置的网络：
                    </p>
                    <ul className="list-disc list-inside text-text-secondary text-sm space-y-1">
                      {paymentConfig && Object.entries(paymentConfig).map(([chainKey, address]) => {
                        if (!address || address.trim() === '') return null
                        const chainId = Object.keys(CHAIN_ID_TO_CONFIG_KEY).find(
                          id => CHAIN_ID_TO_CONFIG_KEY[parseInt(id) as keyof typeof CHAIN_ID_TO_CONFIG_KEY] === chainKey
                        )
                        const chainName = chainId ? CHAIN_INFO[parseInt(chainId) as keyof typeof CHAIN_INFO]?.name : chainKey
                        return (
                          <li key={chainKey}>{chainName}</li>
                        )
                      })}
                      {(!paymentConfig || Object.values(paymentConfig).every(addr => !addr || addr.trim() === '')) && (
                        <li className="text-red-400">暂无可用的支付网络，请联系管理员配置</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-green-400/10 border border-green-400/30 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Check className="h-6 w-6 text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-400">
                        钱包已连接 ({chainInfo.name})
                      </h3>
                      <p className="text-text-secondary">
                        地址: {address?.slice(0, 10)}...{address?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {/* 转账状态显示 */}
                    {isConfirmed && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <Check className="h-5 w-5" />
                        <span className="text-sm font-medium">支付成功</span>
                      </div>
                    )}
                    {/* 断开连接按钮 */}
                    <button
                      onClick={handleWalletDisconnect}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      断开连接
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* 订阅详情 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    订阅详情
                  </h3>
                  <div className="bg-background-card rounded-lg p-6 border border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-secondary">套餐</span>
                      <span className="font-semibold text-amber-400">
                        {membershipPlan.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-secondary">价格</span>
                      <span className="font-semibold text-text-primary">
                        {membershipPlan.priceInUSDT} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-text-secondary">网络</span>
                      <span className="font-semibold text-text-primary">
                        {chainInfo?.name || '请连接钱包'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">有效期</span>
                      <span className="font-semibold text-text-primary">{membershipPlan.duration}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 付款方式 */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-text-primary mb-4">
                    USDT付款
                  </h3>
                  <div className="bg-background-card rounded-lg p-6 border border-gray-700">
                    {chainInfo ? (
                      <>
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            收款地址 ({chainInfo.name})
                          </label>
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 bg-background-secondary border border-gray-600 rounded-lg p-3 font-mono text-sm text-text-primary break-all">
                              {chainInfo.paymentAddress}
                            </div>
                            <button
                              onClick={copyAddress}
                              className="p-3 bg-primary hover:bg-primary-light text-white rounded-lg transition-colors"
                              title="复制地址"
                            >
                              {copied ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            支付金额
                          </label>
                          <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-4">
                            <div className="text-2xl font-bold text-amber-400 text-center">
                              {membershipPlan.priceInUSDT} USDT
                            </div>
                          </div>
                        </div>

                        {/* 智能支付按钮 */}
                        <div className="space-y-4">
                          {/* 错误信息显示 */}
                          {errorMessage && (
                            <div className="bg-red-400/10 border border-red-400/30 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                <span className="text-red-400 text-sm">{errorMessage}</span>
                              </div>
                            </div>
                          )}

                          {/* 余额不足时显示充值提示 */}
                          {!hasEnoughBalance && usdtBalance !== undefined && usdtDecimals !== undefined && (
                            <div className="bg-amber-400/10 border border-amber-400/30 rounded-lg p-3">
                              <div className="flex items-start space-x-2">
                                <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                                <div className="text-amber-400 text-sm">
                                  <div>USDT余额不足</div>
                                  <div>当前: {(Number(usdtBalance || 0) / Math.pow(10, usdtDecimals)).toFixed(2)} USDT</div>
                                  <div>需要: {membershipPlan.priceInUSDT} USDT</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 支付按钮 */}
                          <button
                            onClick={handleUSDTTransfer}
                            disabled={transferStep !== 'idle' && transferStep !== 'error' || !hasEnoughBalance}
                            className={`w-full text-white py-3 px-6 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 ${
                              selectedSubscriptionType === 'vip' 
                                ? 'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700' 
                                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                            }`}
                            title={`按钮状态: ${transferStep !== 'idle' && transferStep !== 'error' ? '处理中' : !hasEnoughBalance ? '余额不足' : '可点击'}`}
                          >
                            {transferStep === 'checking' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>检查中...</span>
                              </>
                            ) : transferStep === 'transferring' || isTransferPending ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>转账中...</span>
                              </>
                            ) : isConfirming ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>确认中...</span>
                              </>
                            ) : transferStep === 'activating' ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>激活会员权益中...</span>
                              </>
                            ) : transferStep === 'success' ? (
                              <>
                                <Check className="h-4 w-4" />
                                <span>支付成功</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="h-4 w-4" />
                                <span>一键支付 {membershipPlan.priceInUSDT} USDT</span>
                              </>
                            )}
                          </button>

                          {hash && (
                            <div className="text-center">
                              <a
                                href={`${chainInfo.explorer}/tx/${hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center space-x-2 text-primary hover:text-primary-light transition-colors text-sm"
                              >
                                <span>查看交易详情</span>
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 text-center">
                          <a
                            href={`${chainInfo.explorer}/address/${chainInfo.paymentAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-primary hover:text-primary-light transition-colors text-sm"
                          >
                            <span>在区块链浏览器查看地址</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </>
                    ) : (
                      <div className="text-center text-text-secondary py-8">
                        <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p>请连接钱包并切换到支持的网络</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

              </>
            )}

            {/* 认证加载状态 */}
            {authLoading && (
              <div className="bg-background-card rounded-lg p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                </div>
                <p className="text-text-secondary">正在检查登录状态...</p>
              </div>
            )}

            {/* 配置加载状态 */}
            {loadingConfig && (
              <div className="bg-background-card rounded-lg p-8 text-center">
                <div className="flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                </div>
                <p className="text-text-secondary">正在加载支付配置...</p>
              </div>
            )}
          </div>
        )}

        {/* 会员权益介绍 */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-text-primary text-center mb-12">
            {selectedSubscriptionType === 'vip' ? 'VIP会员专享权益' : '交易会员专享权益'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(selectedSubscriptionType === 'vip' ? [
              {
                icon: FileText,
                title: '专业投研',
                description: '深度市场分析和项目评估报告',
                color: 'text-blue-400'
              },
              {
                icon: Zap,
                title: '实时数据',
                description: '第一时间获得市场动态和价格变化',
                color: 'text-amber-400'
              },
              {
                icon: Shield,
                title: '优先支持',
                description: '专属客服和技术支持服务',
                color: 'text-purple-400'
              }
            ] : [
              {
                icon: Zap,
                title: '交易信号',
                description: '实时交易信号和入场时机提醒',
                color: 'text-blue-400'
              },
              {
                icon: FileText,
                title: '策略指导',
                description: '专业交易策略和风险管理建议',
                color: 'text-amber-400'
              },
              {
                icon: Coins,
                title: '交易工具',
                description: '高级交易工具和数据分析功能',
                color: 'text-green-400'
              },
              {
                icon: Shield,
                title: '专属服务',
                description: '一对一交易指导和专属客服',
                color: 'text-purple-400'
              }
            ]).map((benefit, index) => (
              <div
                key={index}
                className="bg-background-card rounded-xl p-6 border border-gray-700 hover-glow hover:scale-105 transition-all text-center"
              >
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-current/10 mb-4 ${benefit.color}`}>
                  <benefit.icon className={`h-6 w-6 ${benefit.color}`} />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {benefit.title}
                </h3>
                <p className="text-text-muted text-sm leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 钱包选择弹窗 */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 min-h-screen">
          <div className="bg-background-card border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden my-auto sm:my-0">
            {/* 弹窗头部 */}
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                选择钱包
              </h3>
              <button
                onClick={() => {
                  setShowWalletModal(false)
                  clearWalletMessage()
                }}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {/* 消息显示 */}
              {walletMessage && (
                <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                  walletMessage.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <span className="text-sm">{walletMessage.text}</span>
                </div>
              )}

              {/* 钱包选择部分 */}
              <div className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-text-primary mb-4">
                  选择要连接的钱包
                </h4>
                <p className="text-sm text-text-muted mb-4">
                  选择一个钱包进行连接以进行支付
                </p>
                
                {/* 移动端：直接显示连接按钮 */}
                {isMobile ? (
                  <button
                    onClick={() => handleWalletConnect()}
                    disabled={isConnectingWallet}
                    className="w-full p-4 rounded-lg border border-transparent hover:border-gray-600 hover:bg-background-secondary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {isConnectingWallet ? '连接中...' : '连接钱包'}
                        </div>
                        <div className="text-xs text-text-muted">
                          {(() => {
                            const dappBrowser = detectMobileDAppBrowser()
                            if (dappBrowser) {
                              switch (dappBrowser.type) {
                                case 'okx': return '使用OKX钱包'
                                case 'tokenpocket': return '使用TokenPocket钱包'
                                case 'metamask': return '使用MetaMask钱包'
                                case 'coinbase': return '使用Coinbase钱包'
                                case 'trust': return '使用Trust钱包'
                                case 'imtoken': return '使用imToken钱包'
                                case 'bitget': return '使用Bitget钱包'
                                case 'generic': return '使用DApp浏览器内置钱包'
                                default: return '使用DApp浏览器内置钱包'
                              }
                            }
                            return '使用DApp浏览器内置钱包'
                          })()}
                        </div>
                      </div>
                    </div>
                  </button>
                ) : (
                  /* 桌面端：显示固定顺序钱包列表 */
                  <div className="space-y-2">
                    {[
                      'MetaMask',
                      'OKX Wallet',
                      'Binance Wallet',
                      'TokenPocket',
                      'Coinbase Wallet',
                      'WalletConnect',
                    ].map((displayName) => {
                      const installed = isWalletInstalled(displayName)
                      const connector = getConnectorForDisplay(displayName)
                      return (
                        <button
                          key={displayName}
                          onClick={() => {
                            if (installed && connector) {
                              handleWalletConnect(connector)
                            }
                          }}
                          disabled={!installed || !connector || isConnectingWallet}
                          className={`w-full p-3 rounded-lg border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            installed && connector && !isConnectingWallet
                              ? 'border-transparent hover:border-gray-600 hover:bg-background-secondary'
                              : 'border-gray-600 bg-background-secondary/50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <img
                              src={getWalletIcon(displayName)}
                              alt={displayName}
                              className="w-6 h-6 flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-text-primary">
                                {displayName}
                              </div>
                            </div>
                            <div className="text-xs text-text-muted">
                              {installed ? '已安装' : '未安装'}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
