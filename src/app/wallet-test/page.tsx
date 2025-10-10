'use client'

import { useState } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { useWalletAuth, WALLET_LOGIN_MESSAGE } from '@/lib/walletAuth'
import { Wallet, CheckCircle, XCircle, Loader } from 'lucide-react'

export default function WalletTestPage() {
  const { address, isConnected, chain } = useAccount()
  const { signMessageAsync, isPending: isSigning } = useSignMessage()
  const { loginWithWallet, isSigning: isAuthSigning } = useWalletAuth()
  
  const [authResult, setAuthResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [step, setStep] = useState<'idle' | 'connected' | 'signing' | 'authenticated' | 'error'>('idle')

  const handleSignMessage = async () => {
    if (!address) return
    
    setError('')
    setStep('signing')
    
    try {
      const signature = await signMessageAsync({ message: WALLET_LOGIN_MESSAGE })
      console.log('签名成功:', signature)
      
      // 直接调用登录API
      const result = await loginWithWallet(address, chain?.id || 1)
      
      if (result.success) {
        setAuthResult(result)
        setStep('authenticated')
      } else {
        setError(result.error || '认证失败')
        setStep('error')
      }
    } catch (err: any) {
      setError(err.message || '签名失败')
      setStep('error')
    }
  }

  const getStepIcon = () => {
    switch (step) {
      case 'idle':
        return <Wallet className="h-5 w-5 text-gray-400" />
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-blue-400" />
      case 'signing':
        return <Loader className="h-5 w-5 text-yellow-400 animate-spin" />
      case 'authenticated':
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Wallet className="h-5 w-5 text-gray-400" />
    }
  }

  const getStepText = () => {
    switch (step) {
      case 'idle':
        return '等待连接钱包'
      case 'connected':
        return '钱包已连接'
      case 'signing':
        return '正在签名...'
      case 'authenticated':
        return '认证成功'
      case 'error':
        return '认证失败'
      default:
        return '未知状态'
    }
  }

  return (
    <div className="min-h-screen bg-background-primary p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-text-primary mb-8">钱包登录测试</h1>
        
        {/* 状态指示器 */}
        <div className="bg-background-secondary rounded-lg p-6 mb-6 border border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            {getStepIcon()}
            <span className="text-text-primary font-medium">{getStepText()}</span>
          </div>
          
          {isConnected && address && (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">钱包地址:</span>
                <span className="text-text-primary font-mono">{address}</span>
              </div>
              {chain && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">网络:</span>
                  <span className="text-text-primary">{chain.name}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 签名消息显示 */}
        <div className="bg-background-secondary rounded-lg p-6 mb-6 border border-gray-700">
          <h3 className="text-lg font-semibold text-text-primary mb-3">签名消息</h3>
          <div className="bg-background-tertiary rounded p-3 border border-gray-600">
            <code className="text-text-primary font-mono">{WALLET_LOGIN_MESSAGE}</code>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center text-text-secondary">
              请先连接钱包
            </div>
          ) : (
            <button
              onClick={handleSignMessage}
              disabled={isSigning || isAuthSigning}
              className="w-full bg-primary hover:bg-primary-light text-white py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {(isSigning || isAuthSigning) ? (
                <>
                  <Loader className="h-5 w-5 animate-spin" />
                  <span>处理中...</span>
                </>
              ) : (
                <>
                  <Wallet className="h-5 w-5" />
                  <span>签名登录</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400 font-medium">错误</span>
            </div>
            <p className="text-red-300 mt-2">{error}</p>
          </div>
        )}

        {/* 认证结果 */}
        {authResult && (
          <div className="mt-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-400 font-medium">认证成功</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">用户ID:</span>
                <span className="text-text-primary">{authResult.user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">昵称:</span>
                <span className="text-text-primary">{authResult.user?.nickname}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">钱包地址:</span>
                <span className="text-text-primary font-mono">{authResult.user?.wallet_address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Token:</span>
                <span className="text-text-primary font-mono text-xs break-all">{authResult.token?.slice(0, 20)}...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
