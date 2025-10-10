import { useSignMessage } from 'wagmi'
import { publicAPI } from './publicAPI'

export interface WalletAuthResult {
  success: boolean
  token?: string
  user?: any
  error?: string
}

export interface WalletLoginResponse {
  api_code: number
  api_msg: string
  data: {
    token: string
    user: {
      id: number
      wallet_address: string
      wallet_chain_id: number
      nickname: string
      avatar: string
      accountfrom: number
      regtime: number
      lastlogin: number
    }
  }
}

// 固定的签名消息
export const WALLET_LOGIN_MESSAGE = "Login LuLaLa"

/**
 * 钱包登录
 * @param walletAddress 钱包地址
 * @param signature 签名
 * @param chainId 链ID
 * @returns Promise<WalletLoginResponse>
 */
export async function walletLogin(
  walletAddress: string,
  signature: string,
  chainId: number = 1
): Promise<WalletLoginResponse> {
  const response = await publicAPI.post('/v1/users/walletLogin', {
    wallet_address: walletAddress,
    signature: signature,
    chain_id: chainId
  })
  
  if (response.api_code !== 200) {
    throw new Error(response.api_msg || '钱包登录失败')
  }
  
  return response as WalletLoginResponse
}

/**
 * 钱包身份验证Hook
 * @returns 钱包认证相关的方法和状态
 */
export function useWalletAuth() {
  const { signMessageAsync, isPending: isSigning } = useSignMessage()

  /**
   * 执行钱包登录
   * @param walletAddress 钱包地址
   * @param chainId 链ID
   * @returns Promise<WalletAuthResult>
   */
  const loginWithWallet = async (
    walletAddress: string,
    chainId: number = 1
  ): Promise<WalletAuthResult> => {
    try {
      // 1. 用户对固定消息签名
      const signature = await signMessageAsync({ message: WALLET_LOGIN_MESSAGE })

      // 2. 登录
      const loginResponse = await walletLogin(walletAddress, signature, chainId)

      return {
        success: true,
        token: loginResponse.data.token,
        user: loginResponse.data.user
      }
    } catch (error: any) {
      console.error('钱包登录失败:', error)
      return {
        success: false,
        error: error.message || '钱包登录失败'
      }
    }
  }

  return {
    loginWithWallet,
    isSigning
  }
}

/**
 * 验证钱包地址格式
 * @param address 钱包地址
 * @returns boolean
 */
export function isValidWalletAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * 格式化钱包地址显示
 * @param address 钱包地址
 * @param startLength 开头显示长度
 * @param endLength 结尾显示长度
 * @returns string
 */
export function formatWalletAddress(
  address: string,
  startLength: number = 6,
  endLength: number = 4
): string {
  if (!address) return ''
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`
}

/**
 * 获取链名称
 * @param chainId 链ID
 * @returns string
 */
export function getChainName(chainId: number): string {
  const chainNames: Record<number, string> = {
    1: 'Ethereum',
    56: 'BSC',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
    11155111: 'Sepolia',
    8453: 'Base'
  }
  
  return chainNames[chainId] || `Chain ${chainId}`
}

/**
 * 检查错误是否为用户取消操作
 * @param error 错误对象
 * @returns boolean
 */
export function isUserRejectedError(error: any): boolean {
  if (!error) return false
  
  // 检查错误代码
  if (error.code === 4001) return true // MetaMask用户拒绝
  
  // 检查错误消息
  if (error.message) {
    const message = error.message.toLowerCase()
    return (
      message.includes('user rejected') ||
      message.includes('user denied') ||
      message.includes('cancelled') ||
      message.includes('rejected') ||
      message.includes('用户拒绝') ||
      message.includes('用户取消') ||
      message.includes('rpc error: user rejected') ||
      message.includes('the requested method and/or account has not been authorized') ||
      message.includes('the requested account and/or method has not been authorized')
    )
  }
  
  return false
}

/**
 * 获取用户友好的错误消息
 * @param error 错误对象
 * @returns string
 */
export function getWalletErrorMessage(error: any): string {
  if (isUserRejectedError(error)) {
    return '用户取消了操作'
  }
  
  if (error.message) {
    // 处理常见的钱包错误
    if (error.message.includes('No Ethereum provider')) {
      return '未检测到钱包，请安装MetaMask或其他Web3钱包'
    }
    if (error.message.includes('Already processing')) {
      return '钱包正在处理其他请求，请稍后再试'
    }
    if (error.message.includes('Network error')) {
      return '网络连接错误，请检查网络连接'
    }
    return error.message
  }
  
  return '未知错误'
}
