'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi'
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Check,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X
} from 'lucide-react'
import { publicAPI } from '@/lib/publicAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { getInviteCookie } from '@/lib/inviteUtils'
import InviteCodeModal from './InviteCodeModal'

interface UnifiedLoginProps {
  compact?: boolean
  initialMode?: 'login' | 'register'
  onClose?: () => void
}

interface UserInfo {
  id: number
  wallet_address?: string
  email?: string
  nickname: string
  avatar: string
  vip_level?: number
  vip_vailddate?: number
  login_method?: 'wallet' | 'google' | 'email'
}

export default function UnifiedLogin({ compact = false, initialMode, onClose }: UnifiedLoginProps) {
  const [isClient, setIsClient] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [isBindingWallet, setIsBindingWallet] = useState(false)
  const [showInviteCodeModal, setShowInviteCodeModal] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const [showDropdown, setShowDropdown] = useState(false)
  const [copied, setCopied] = useState(false)
  const [hasRequestedSignature, setHasRequestedSignature] = useState(false)
  const [shouldAutoSign, setShouldAutoSign] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  
  // 邮箱登录状态
  const [emailMode, setEmailMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  })

  const { isAuthenticated, user, walletLogin, googleLogin, emailLogin, emailSignup, sendPasswordReset, logout, refreshAuth } = useMultiAuth()
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()
  const { signMessage, isPending: isSigning, data: signatureData, error: signError } = useSignMessage()

  // 检测是否为移动端
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    setIsClient(true)
    setIsMobile(window.innerWidth < 768)
  }, [])

  // 处理 initialMode
  useEffect(() => {
    if (initialMode === 'login') {
      setShowLoginModal(true)
    } else if (initialMode === 'register') {
      setShowRegisterModal(true)
    }
  }, [initialMode])

  // 关闭弹窗的辅助函数
  const closeModals = useCallback(() => {
    setShowLoginModal(false)
    setShowRegisterModal(false)
    setIsBindingWallet(false)
    if (onClose) {
      onClose()
    }
  }, [onClose])

  // 监听绑定钱包事件
  useEffect(() => {
    const handleShowWalletBindingModal = () => {
      setIsBindingWallet(true)
      setShowLoginModal(true)
    }

    window.addEventListener('show-wallet-binding-modal', handleShowWalletBindingModal)
    
    return () => {
      window.removeEventListener('show-wallet-binding-modal', handleShowWalletBindingModal)
    }
  }, [])

  // 调试用户状态
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('当前用户状态:', {
        wallet_address: user.wallet_address,
        email: user.email,
        nickname: user.nickname,
        hasWalletAddress: !!user.wallet_address,
        shouldShowBindButton: !user.wallet_address || user.wallet_address === ''
      })
    }
  }, [isAuthenticated, user])

  // 调试弹窗状态
  useEffect(() => {
    console.log('登录弹窗状态变化:', showLoginModal, '绑定模式:', isBindingWallet)
  }, [showLoginModal, isBindingWallet])

  // 清除消息
  const clearMessage = () => setMessage(null)

  // 显示消息
  const showMessage = (type: 'error' | 'success', text: string) => {
    setMessage({ type, text })
    setTimeout(clearMessage, 5000)
  }

  const handleLoginAfterSignature = useCallback(async (signature: string) => {
    try {
      const endpoint = isRegisterMode ? '/v1/users/walletRegister' : '/v1/users/walletLogin'
      const message = isRegisterMode ? 'Register LuLaLa' : 'Login LuLaLa'
      
      const response = await publicAPI.post(endpoint, {
        wallet_address: address,
        signature,
        chain_id: chain?.id || 1
      })
      
      if (response.api_code == 200) {
        // 使用 MultiAuthContext 的钱包登录方法来更新状态
        await walletLogin(response.data.token, response.data.expire_time)
        
        if (isRegisterMode) {
          closeModals()
          showMessage('success', '注册成功')
        } else {
          closeModals()
          if (isBindingWallet) {
            showMessage('success', '钱包绑定成功')
          } else {
            showMessage('success', '钱包登录成功')
          }
        }
      } else {
        const errorMsg = isRegisterMode ? '注册失败' : (isBindingWallet ? '绑定失败' : '登录失败')
        throw new Error(response.api_msg || errorMsg)
      }
    } catch (error: any) {
      const errorMsg = isRegisterMode ? '注册失败' : (isBindingWallet ? '绑定失败' : '登录失败')
      console.error(errorMsg + ':', error)
      showMessage('error', error.message || errorMsg)
      disconnect()
    } finally {
      setHasRequestedSignature(false)
      setShouldAutoSign(false)
      setIsBindingWallet(false)
      setIsRegisterMode(false)
    }
  }, [isRegisterMode, address, chain, walletLogin, isBindingWallet, closeModals, showMessage, disconnect])

  // 钱包登录逻辑
  useEffect(() => {
    if (signatureData && hasRequestedSignature) {
      handleLoginAfterSignature(signatureData)
    }
  }, [signatureData, hasRequestedSignature, handleLoginAfterSignature])

  const handleSignatureError = useCallback((error: any) => {
    const code = error?.code ?? error?.cause?.code
    const message: string = error?.message || ''
    if (code === 4001 || /user rejected/i.test(message)) {
      console.warn('签名被用户取消:', error)
      showMessage('error', '已取消签名')
    } else {
      console.error('签名失败:', error)
      showMessage('error', '签名失败，请重试')
    }
    disconnect()

    setHasRequestedSignature(false)
    setShouldAutoSign(false)
    setIsBindingWallet(false)
  }, [showMessage, disconnect])

  useEffect(() => {
    if (signError && hasRequestedSignature) {
      handleSignatureError(signError)
    }
  }, [signError, hasRequestedSignature, handleSignatureError])

  // 邀请码验证成功后的回调
  const handleInviteCodeSuccess = useCallback(() => {
    // 关闭邀请码弹窗，显示钱包注册弹窗
    setShowInviteCodeModal(false)
    setShowRegisterModal(true)
  }, [])

  // 关闭邀请码弹窗的回调
  const handleInviteCodeClose = useCallback(() => {
    setShowInviteCodeModal(false)
  }, [])

  const handleWalletConnect = useCallback(async (connector?: any, isBinding = false, isRegister = false, retryCount = 0) => {
    // 防止重复连接
    if (isConnecting) {
      console.log('⚠️ 连接已在进行中，跳过重复请求')
      return
    }

    // 如果已经连接且有地址，需要检查钱包是否真正可用（未被锁定）
    if (isConnected && address) {
      console.log('🔗 检测到已连接状态，验证钱包是否可用...')
      
      // 检查钱包是否真正可用（未被锁定）
      const win = window as any
      let walletLocked = false
      
      // 检查 MetaMask 是否被锁定
      if (win.ethereum?.isMetaMask) {
        // 如果没有 selectedAddress，说明钱包被锁定了
        if (!win.ethereum.selectedAddress) {
          console.log('🔒 检测到钱包已锁定')
          walletLocked = true
        }
      }
      
      // 如果钱包被锁定，先断开连接，然后重新连接
      if (walletLocked) {
        console.log('🔄 钱包已锁定，断开并重新连接...')
        disconnect()
        // 等待断开完成
        await new Promise(resolve => setTimeout(resolve, 300))
      } else {
        // 钱包未被锁定，尝试直接签名
        console.log('✅ 钱包可用，直接进入签名流程')
        setIsBindingWallet(isBinding)
        setIsRegisterMode(isRegister)
        setShouldAutoSign(true)
        if (!hasRequestedSignature) {
          console.log('✅ 触发签名请求（已连接早退分支）')
          setHasRequestedSignature(true)
          const message = isRegister ? 'Register LuLaLa' : 'Login LuLaLa'
          try {
            await signMessage({ message })
          } catch (error: any) {
            console.error('❌ 签名失败，可能钱包被锁定:', error)
            // 如果签名失败，尝试断开重连
            disconnect()
            await new Promise(resolve => setTimeout(resolve, 300))
            // 继续执行后面的连接逻辑
          }
        }
        return
      }
    }

    setIsConnecting(true)
    
    try {
      let targetConnector = connector
      
      console.log('🌐 可用connectors:', connectors.map(c => ({ 
        name: c.name, 
        uid: c.uid,
        ready: c.ready,
        type: c.type 
      })))
      
      // 如果没有指定connector，根据环境选择
      if (!connector) {
        console.log('🔍 开始选择connector...')
        
        // 移动端DApp浏览器：使用 injected connector
        if (isMobile) {
          console.log('📱 移动端DApp浏览器，选择 injected connector')
          
          targetConnector = connectors.find(c => 
            c.type === 'injected' || c.name.toLowerCase().includes('injected')
          )
          
          if (targetConnector) {
            console.log('✅ 找到 injected connector:', targetConnector.name)
          } else {
            console.log('⚠️ 未找到 injected connector，使用第一个可用的')
            targetConnector = connectors[0]
          }
        } else {
          // 桌面端：优先选择MetaMask connector
          const metaMaskConnector = connectors.find(c => 
            c.name.toLowerCase().includes('metamask')
          )
          
          if (metaMaskConnector) {
            targetConnector = metaMaskConnector
            console.log('🎯 使用MetaMask connector:', metaMaskConnector.name)
          } else {
            // 选择第一个可用的connector
            const availableConnectors = connectors.filter(c => isWalletInstalled(c.name))
            if (availableConnectors.length > 0) {
              targetConnector = availableConnectors[0]
              console.log('🎯 使用第一个可用connector:', targetConnector.name)
            }
          }
        }
      }
      
      if (!targetConnector) {
        console.error('❌ 未找到可用的connector')
        showMessage('error', '未找到可用的钱包连接器')
        return
      }
      
      // 检查connector状态
      console.log('🔍 检查connector状态:', {
        name: targetConnector.name,
        uid: targetConnector.uid,
        ready: targetConnector.ready,
        type: targetConnector.type
      })
      
        // 检查MetaMask是否真正可用（仅桌面端）
        if (!isMobile && targetConnector.name.toLowerCase().includes('metamask')) {
          const win = window as any
          const hasMetaMask = !!(win.ethereum?.isMetaMask)
          
          // 安全地获取 ethereum 属性，避免触发 chainId 错误
          let ethereumInfo = {}
          try {
            ethereumInfo = {
              hasEthereum: !!win.ethereum,
              isMetaMask: hasMetaMask,
              ethereumProviders: win.ethereum?.providers?.length || 0,
              ethereumSelectedAddress: win.ethereum?.selectedAddress,
              // 避免直接访问 chainId，使用 try-catch 包装
              ethereumChainId: (() => {
                try {
                  return win.ethereum?.chainId
                } catch (e: any) {
                  console.warn('无法访问 ethereum.chainId:', e?.message || '未知错误')
                  return 'unknown'
                }
              })()
            }
          } catch (e: any) {
            console.warn('获取 ethereum 信息时出错:', e?.message || '未知错误')
            ethereumInfo = { hasEthereum: false, isMetaMask: false }
          }
          
          console.log('🦊 MetaMask可用性检查:', ethereumInfo)
        
        if (!hasMetaMask && !isMobile) {
          console.warn('⚠️ MetaMask未检测到，但connector存在')
          showMessage('error', '请确保MetaMask已安装并启用')
          return
        }
        
        // 检查MetaMask是否被锁定
        if (hasMetaMask && !win.ethereum?.selectedAddress) {
          console.log('🔒 MetaMask可能被锁定，尝试连接...')
        }
      }
      
      console.log('✅ 最终选择的connector:', targetConnector.name)
      setShouldAutoSign(true)
      setHasRequestedSignature(false)
      setIsBindingWallet(isBinding)
      setIsRegisterMode(isRegister)
      
      // 添加连接超时处理
      console.log('🚀 开始连接钱包...')
      
      // 对于MetaMask（仅桌面端），先尝试检查连接状态
      if (!isMobile && targetConnector.name.toLowerCase().includes('metamask')) {
        const win = window as any
        if (win.ethereum?.isMetaMask) {
          try {
            // 尝试获取账户信息，这会触发MetaMask弹窗
            const accounts = await win.ethereum.request({ method: 'eth_accounts' })
            console.log('🔍 MetaMask账户检查结果:', accounts)
          } catch (error) {
            console.log('🔍 MetaMask账户检查失败，继续连接流程:', error)
          }
        }
      }
      
      const connectPromise = connect({ connector: targetConnector })
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('连接超时，请重试')), 30000)
      )
      
      await Promise.race([connectPromise, timeoutPromise])
      console.log('✅ 钱包连接成功')
      
    } catch (error: any) {
      console.error('❌ 钱包连接详细错误:', {
        error,
        code: error?.code ?? error?.cause?.code,
        message: error?.message,
        cause: error?.cause,
        stack: error?.stack
      })
      
      const code = error?.code ?? error?.cause?.code
      const message: string = error?.message || ''
      
      if (code === 4001 || /user rejected/i.test(message)) {
        console.warn('连接被用户取消:', error)
        showMessage('error', '已取消连接')
      } else if (message.includes('连接超时')) {
        console.error('连接超时:', error)
        showMessage('error', '连接超时，请重试')
      } else if (code === -32002) {
        console.error('连接请求已存在:', error)
        showMessage('error', '连接请求已存在，请检查MetaMask')
      } else {
        console.error('钱包连接失败:', error)
        showMessage('error', `钱包连接失败: ${message || '未知错误'}`)
      }

      setHasRequestedSignature(false)
      setShouldAutoSign(false)
      setIsBindingWallet(false)
      
      // 重试机制：对于某些错误进行重试
      if (retryCount < 2 && (
        error?.message?.includes('连接超时') ||
        error?.code === -32002 ||
        error?.message?.includes('Already processing')
      )) {
        console.log(`🔄 准备重试连接 (${retryCount + 1}/2)...`)
        setTimeout(() => {
          handleWalletConnect(connector, isBinding, isRegister, retryCount + 1)
        }, 1000 * (retryCount + 1)) // 递增延迟
        return
      }
    } finally {
      setIsConnecting(false)
    }
  }, [connectors, connect, isConnecting, isConnected, address, hasRequestedSignature, signMessage, isMobile, walletLogin, setShowRegisterModal, setShowLoginModal])


  // 监听钱包连接状态，连接成功后立即签名
  useEffect(() => {
    console.log('🔍 签名触发检查:', {
      shouldAutoSign,
      isConnected,
      address,
      isAuthenticated,
      isSigning,
      hasRequestedSignature,
      isBindingWallet
    })
    
    // 如果用户已认证且不是绑定钱包模式，不触发签名
    if (isAuthenticated && !isBindingWallet) {
      console.log('⚠️ 用户已认证，跳过签名')
      return
    }
    
    // 兜底：如果应当自动签名但尚未请求，延迟强制触发一次
    if (shouldAutoSign && isConnected && address && !hasRequestedSignature) {
      const t = setTimeout(() => {
        // 再次检查用户认证状态
        if (!hasRequestedSignature && (isBindingWallet || !isAuthenticated)) {
          console.log('⏱️ 兜底触发签名请求')
          setHasRequestedSignature(true)
          const message = isRegisterMode ? 'Register LuLaLa' : 'Login LuLaLa'
          signMessage({ message })
        }
      }, 1200)
      return () => clearTimeout(t)
    }

    if (
      shouldAutoSign &&
      isConnected &&
      address &&
      !hasRequestedSignature
    ) {
      console.log('✅ 触发签名请求')
      setHasRequestedSignature(true)
      const message = isRegisterMode ? 'Register LuLaLa' : 'Login LuLaLa'
      signMessage({ message })
    }
  }, [shouldAutoSign, isConnected, address, isAuthenticated, isSigning, hasRequestedSignature, signMessage, isBindingWallet, isRegisterMode])

  

  // 断开连接
  const handleDisconnect = useCallback(async () => {
    try {
      console.log('🚪 开始退出登录...')
      
      // 先清理所有状态标志，防止触发自动登录
      setHasRequestedSignature(false)
      setShouldAutoSign(false)
      setIsBindingWallet(false)
      setIsRegisterMode(false)
      setShowDropdown(false)
      
      // 使用 MultiAuthContext 的登出方法
      await logout()
      
      localStorage.removeItem('wallet_token')
      localStorage.removeItem('wallet_user')
      
      // 清理后端cookie
      try {
        await fetch('/v1/users/logout', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        })
      } catch (error) {
        console.log('清理cookie失败:', error)
      }
      
      // 断开 wagmi 连接
      disconnect()
      
      // 移动端DApp浏览器：尝试断开 window.ethereum 连接
      if (isMobile) {
        const win = window as any
        if (win.ethereum?.disconnect) {
          try {
            await win.ethereum.disconnect()
            console.log('✅ 移动端钱包断开连接成功')
          } catch (error) {
            console.log('移动端钱包断开连接失败:', error)
          }
        }
      }
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('wallet-auth-logout'))
      }
      
      console.log('✅ 退出登录成功')
    } catch (error) {
      console.error('断开连接时出错:', error)
      disconnect()
    }
  }, [disconnect, logout, isMobile])

  // 复制地址
  const copyAddress = async () => {
    if (user?.wallet_address) {
      await navigator.clipboard.writeText(user.wallet_address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 格式化地址
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

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

  // 检测钱包是否已安装
  const isWalletInstalled = (walletName: string) => {
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
    console.log('🔍 检测钱包:', walletName)
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
    var aConnector = connectors.find(c => c.name.toLowerCase().includes(lower));
    return aConnector;
  }

  if (!isClient) {
    return (
      <button
        disabled
        className={`bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
          compact ? 'py-1.5 px-3 text-sm' : 'w-full py-2 px-4'
        }`}
      >
        <User className="h-4 w-4" />
        {!compact && <span>加载中...</span>}
      </button>
    )
  }

  // 已认证状态
  if (isAuthenticated && user) {
    return (
      <>
        

        {/* 登录/绑定钱包弹窗 - 已登录用户也需要显示（用于绑定钱包） */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 min-h-screen">
            <div className="bg-background-card border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden my-auto sm:my-0">
              {/* 弹窗头部 */}
              <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">
                  {isBindingWallet ? '绑定钱包' : '登录 Lulala LABS'}
                </h3>
                <button
                  onClick={closeModals}
                  className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
                >
                <X className="w-5 h-5 text-text-muted" />
                </button>
              </div>

              <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
                {/* 消息显示 */}
                {message && (
                  <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                    message.type === 'error' 
                      ? 'bg-red-50 text-red-700 border border-red-200' 
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    <span className="text-sm">{message.text}</span>
                  </div>
                )}

                {/* 钱包登录部分 */}
                <div className="p-4 sm:p-6">
                  <h4 className="text-base font-medium text-text-primary mb-4">
                    {isBindingWallet ? '选择要绑定的钱包' : '钱包登录'}
                  </h4>
                  <p className="text-sm text-primary font-medium mb-4">
                    {isBindingWallet ? '选择一个钱包进行绑定' : '该钱包地址会成为您接收空投的地址'}
                  </p>
                  
                  {/* 移动端：直接显示连接按钮 */}
                  {isMobile ? (
                    <button
                      onClick={() => handleWalletConnect(undefined, isBindingWallet)}
                      disabled={isSigning || isConnecting}
                      className="w-full p-4 rounded-lg border border-transparent hover:border-gray-600 hover:bg-background-secondary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-3">
                        <Wallet className="w-6 h-6 text-primary" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-text-primary">
                            {isSigning ? '签名中...' : isConnecting ? '连接中...' : '连接钱包'}
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
                                handleWalletConnect(connector, isBindingWallet)
                              }
                            }}
                            disabled={!installed || !connector || isConnecting}
                            className={`w-full p-3 rounded-lg border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                              installed && connector && !isConnecting
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

        {/* 邀请码输入弹窗 */}
        <InviteCodeModal
          isOpen={showInviteCodeModal}
          onClose={handleInviteCodeClose}
          onSuccess={handleInviteCodeSuccess}
        />
      </>
    )
  }

  // 未登录状态
  return (
    <>
      {/* 如果有 initialMode（从外部调用），不显示按钮，只显示弹窗 */}
      {!initialMode && (
        <div className={`flex space-x-2 ${compact ? 'flex-col space-y-2 space-x-0' : 'flex-row'}`}>
          <button
            onClick={() => setShowLoginModal(true)}
            data-testid="unified-login-btn"
            className={`bg-primary hover:bg-primary-light text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              compact ? 'py-1.5 px-3 text-sm' : 'flex-1 py-2 px-4'
            }`}
          >
            <User className="h-4 w-4" />
            {!compact && <span>登录</span>}
          </button>
          
          <button
            onClick={() => {
              // 直接显示邀请码输入弹窗
              setShowInviteCodeModal(true)
            }}
            data-testid="unified-register-btn"
            className={`bg-secondary hover:bg-secondary-light text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              compact ? 'py-1.5 px-3 text-sm' : 'flex-1 py-2 px-4'
            }`}
          >
            <User className="h-4 w-4" />
            {!compact && <span>注册</span>}
          </button>
        </div>
      )}

      {/* 登录弹窗 */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 min-h-screen">
          <div className="bg-background-card border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden my-auto sm:my-0">
            {/* 弹窗头部 */}
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                {isBindingWallet ? '绑定钱包' : '登录 Lulala LABS'}
              </h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
              <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {/* 消息显示 */}
              {message && (
                <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* 钱包登录部分 */}
              <div className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-text-primary mb-4">
                  {isBindingWallet ? '选择要绑定的钱包' : '钱包登录'}
                </h4>
                <p className="text-sm text-primary font-medium mb-4">
                  {isBindingWallet ? '选择一个钱包进行绑定' : '该钱包地址会成为您接收空投的地址'}
                </p>
                
                {/* 移动端：直接显示连接按钮 */}
                {isMobile ? (
                  <button
                    onClick={() => handleWalletConnect(undefined, isBindingWallet)}
                    disabled={isSigning || isConnecting}
                    className="w-full p-4 rounded-lg border border-transparent hover:border-gray-600 hover:bg-background-secondary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {isSigning ? '签名中...' : isConnecting ? '连接中...' : '连接钱包'}
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
                              handleWalletConnect(connector, isBindingWallet)
                            }
                          }}
                          disabled={!installed || !connector || isConnecting}
                          className={`w-full p-3 rounded-lg border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            installed && connector && !isConnecting
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

      {/* 注册弹窗 */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 min-h-screen">
          <div className="bg-background-card border border-gray-700 rounded-xl shadow-2xl w-full max-w-md max-h-[85vh] overflow-hidden my-auto sm:my-0">
            {/* 弹窗头部 */}
            <div className="p-4 sm:p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-primary">
                注册 Lulala LABS
              </h3>
              <button
                onClick={closeModals}
                className="p-2 hover:bg-background-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
              {/* 消息显示 */}
              {message && (
                <div className={`mx-6 mt-4 p-3 rounded-lg flex items-center space-x-2 ${
                  message.type === 'error' 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
                }`}>
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              {/* 钱包注册部分 */}
              <div className="p-4 sm:p-6">
                <h4 className="text-base font-medium text-text-primary mb-4">
                  钱包注册
                </h4>
                <p className="text-sm text-primary font-medium mb-4">
                  该钱包地址将成为您的账户地址
                </p>
                
                {/* 移动端：直接显示连接按钮 */}
                {isMobile ? (
                  <button
                    onClick={() => handleWalletConnect(undefined, false, true)}
                    disabled={isSigning || isConnecting}
                    className="w-full p-4 rounded-lg border border-transparent hover:border-gray-600 hover:bg-background-secondary transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-6 h-6 text-primary" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {isSigning ? '签名中...' : isConnecting ? '连接中...' : '连接钱包注册'}
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
                                handleWalletConnect(connector, false, true)
                              }
                            }}
                          disabled={!installed || !connector || isConnecting}
                          className={`w-full p-3 rounded-lg border transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                            installed && connector && !isConnecting
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

      {/* 邀请码输入弹窗 */}
      <InviteCodeModal
        isOpen={showInviteCodeModal}
        onClose={handleInviteCodeClose}
        onSuccess={handleInviteCodeSuccess}
      />
      
    </>
  )
}
