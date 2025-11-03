'use client'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import AdminLayout from '@/components/AdminLayout'
import { useState, useEffect } from 'react'
import { 
  Github, 
  Mail, 
  MessageCircle,
  Save,
  RefreshCw,
  Wallet,
  Copy,
  Check
} from 'lucide-react'
import { XIcon, TelegramIcon, DiscordIcon } from '@/components/CustomIcons'

interface SocialLinks {
  twitter: string
  telegram: string
  discord: string
  github: string
  email: string
}

interface PaymentAddresses {
  ethereum: string
  bsc: string
  polygon: string
  arbitrum: string
  optimism: string
}

interface VipConfig {
  price: string
  duration: string
}

interface TradeConfig {
  price: string
  duration: string
}

interface InviteRatioConfig {
  ambassadorInviteVip: string
  vipInviteVip: string
  normalInviteVip: string
}

// 链信息配置
const CHAIN_INFO = {
  ethereum: { name: 'Ethereum', chainId: 1, symbol: 'ETH' },
  bsc: { name: 'BSC', chainId: 56, symbol: 'BNB' },
  polygon: { name: 'Polygon', chainId: 137, symbol: 'MATIC' },
  arbitrum: { name: 'Arbitrum', chainId: 42161, symbol: 'ETH' },
  optimism: { name: 'Optimism', chainId: 10, symbol: 'ETH' },
}

export default function AdminSettings() {
  const { isAuthenticated, loading } = useAdminAuth()
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: '',
    telegram: '',
    discord: '',
    github: '',
    email: ''
  })
  const [paymentAddresses, setPaymentAddresses] = useState<PaymentAddresses>({
    ethereum: '',
    bsc: '',
    polygon: '',
    arbitrum: '',
    optimism: ''
  })
  const [vipConfig, setVipConfig] = useState<VipConfig>({
    price: '300',
    duration: '12个月'
  })
  const [tradeConfig, setTradeConfig] = useState<TradeConfig>({
    price: '300',
    duration: '12个月'
  })
  const [inviteRatioConfig, setInviteRatioConfig] = useState<InviteRatioConfig>({
    ambassadorInviteVip: '50',
    vipInviteVip: '30',
    normalInviteVip: '20'
  })
  const [saving, setSaving] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(true)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)
  const [moreHelpText, setMoreHelpText] = useState<string>('')
  const [faqText, setFaqText] = useState<string>('')

  // 加载配置
  const loadConfig = async () => {
    try {
      setLoadingConfig(true)
      const response = await fetch('/v1/global/config')
      const data = await response.json()
      console.log('加载配置:', data)
      if (data.api_code == 200) {
        setSocialLinks({
          twitter: data.twitter || '',
          telegram: data.telegram || '',
          discord: data.discord || '',
          github: data.github || '',
          email: data.email || ''
        })
        setPaymentAddresses({
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
        setInviteRatioConfig({
          ambassadorInviteVip: data.ambassador_invite_vip_ratio || '50',
          vipInviteVip: data.vip_invite_vip_ratio || '30',
          normalInviteVip: data.normal_invite_vip_ratio || '20'
        })
        setMoreHelpText(data.more_help_text || '')
        setFaqText(data.faq_text || '')
      }
    } catch (error) {
      console.error('加载配置失败:', error)
      setMessage({ type: 'error', text: '加载配置失败' })
    } finally {
      setLoadingConfig(false)
    }
  }

  // 保存配置
  const saveConfig = async () => {
    try {
      setSaving(true)
      setMessage(null)
      
      // 验证VIP配置
      if (!validateVipConfig()) {
        setSaving(false)
        return
      }
      
      // 验证交易会员配置
      if (!validateTradeConfig()) {
        setSaving(false)
        return
      }
      
      // 验证邀请比例配置
      if (!validateInviteRatioConfig()) {
        setSaving(false)
        return
      }
      
      const formData = new FormData()
      formData.append('twitter', socialLinks.twitter)
      formData.append('telegram', socialLinks.telegram)
      formData.append('discord', socialLinks.discord)
      formData.append('github', socialLinks.github)
      formData.append('email', socialLinks.email)
      formData.append('payment_address_ethereum', paymentAddresses.ethereum)
      formData.append('payment_address_bsc', paymentAddresses.bsc)
      formData.append('payment_address_polygon', paymentAddresses.polygon)
      formData.append('payment_address_arbitrum', paymentAddresses.arbitrum)
      formData.append('payment_address_optimism', paymentAddresses.optimism)
      formData.append('vip_price', vipConfig.price)
      formData.append('vip_duration', vipConfig.duration)
      formData.append('trade_price', tradeConfig.price)
      formData.append('trade_duration', tradeConfig.duration)
      formData.append('ambassador_invite_vip_ratio', inviteRatioConfig.ambassadorInviteVip)
      formData.append('vip_invite_vip_ratio', inviteRatioConfig.vipInviteVip)
      formData.append('normal_invite_vip_ratio', inviteRatioConfig.normalInviteVip)
      formData.append('more_help_text', moreHelpText)
      formData.append('faq_text', faqText)
      
      const response = await fetch('/v1/admin/saveConfig', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      
      if (data.api_code == 200) {
        setMessage({ type: 'success', text: '配置保存成功' })
      } else {
        setMessage({ type: 'error', text: data.api_msg || '保存失败' })
      }
    } catch (error) {
      console.error('保存配置失败:', error)
      setMessage({ type: 'error', text: '保存配置失败' })
    } finally {
      setSaving(false)
    }
  }

  // 复制地址到剪贴板
  const copyAddress = async (address: string, chainKey: string) => {
    try {
      await navigator.clipboard.writeText(address)
      setCopiedAddress(chainKey)
      setTimeout(() => setCopiedAddress(null), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  // 验证VIP配置
  const validateVipConfig = (): boolean => {
    const price = parseFloat(vipConfig.price)
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: 'VIP价格必须是大于0的数字' })
      return false
    }
    if (price > 10000) {
      setMessage({ type: 'error', text: 'VIP价格不能超过10000 USDT' })
      return false
    }
    if (!vipConfig.duration.trim()) {
      setMessage({ type: 'error', text: '请输入VIP有效期描述' })
      return false
    }
    return true
  }

  // 验证交易会员配置
  const validateTradeConfig = (): boolean => {
    const price = parseFloat(tradeConfig.price)
    if (isNaN(price) || price <= 0) {
      setMessage({ type: 'error', text: '交易会员价格必须是大于0的数字' })
      return false
    }
    if (price > 10000) {
      setMessage({ type: 'error', text: '交易会员价格不能超过10000 USDT' })
      return false
    }
    if (!tradeConfig.duration.trim()) {
      setMessage({ type: 'error', text: '请输入交易会员有效期描述' })
      return false
    }
    return true
  }

  // 验证邀请比例配置
  const validateInviteRatioConfig = (): boolean => {
    const ambassadorRatio = parseFloat(inviteRatioConfig.ambassadorInviteVip)
    const vipRatio = parseFloat(inviteRatioConfig.vipInviteVip)
    const normalRatio = parseFloat(inviteRatioConfig.normalInviteVip)
    
    if (isNaN(ambassadorRatio) || ambassadorRatio < 0 || ambassadorRatio > 100) {
      setMessage({ type: 'error', text: '大使邀请VIP比例必须在0-100之间' })
      return false
    }
    if (isNaN(vipRatio) || vipRatio < 0 || vipRatio > 100) {
      setMessage({ type: 'error', text: 'VIP邀请VIP比例必须在0-100之间' })
      return false
    }
    if (isNaN(normalRatio) || normalRatio < 0 || normalRatio > 100) {
      setMessage({ type: 'error', text: '普通人邀请VIP比例必须在0-100之间' })
      return false
    }
    
    return true
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadConfig()
    }
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">系统设置</h2>
          <p className="text-gray-600">管理平台的基本配置信息</p>
        </div>

        {/* 导航锚链接 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速导航</h3>
          <div className="flex flex-wrap gap-3">
            <a
              href="#social-links"
              className="inline-flex items-center px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
            >
              <XIcon className="h-4 w-4 mr-2" />
              社交链接设置
            </a>
            <a
              href="#payment-addresses"
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Wallet className="h-4 w-4 mr-2" />
              收款地址配置
            </a>
            <a
              href="#vip-config"
              className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <span className="text-lg mr-2">👑</span>
              VIP会员配置
            </a>
            <a
              href="#trade-config"
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <span className="text-lg mr-2">⚡</span>
              交易会员配置
            </a>
            <a
              href="#invite-ratio-config"
              className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <span className="text-lg mr-2">🎯</span>
              邀请比例设置
            </a>
            <a
              href="#more-help-config"
              className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
            >
              <span className="text-lg mr-2">📘</span>
              更多帮助
            </a>
            <a
              href="#faq-config"
              className="inline-flex items-center px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
            >
              <span className="text-lg mr-2">❓</span>
              常见问题
            </a>
          </div>
        </div>

        {/* 社交链接设置 */}
        <div id="social-links" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">社交链接设置</h3>
            <p className="text-sm text-gray-600 mt-1">配置平台在移动端菜单中显示的社交链接</p>
          </div>
          
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {/* X (Twitter) */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg">
                    <XIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      X (Twitter) 链接
                    </label>
                    <input
                      type="url"
                      value={socialLinks.twitter}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="https://twitter.com/your_account"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Telegram */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                    <TelegramIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telegram 链接
                    </label>
                    <input
                      type="url"
                      value={socialLinks.telegram}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                      placeholder="https://t.me/your_channel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* Discord */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg">
                    <DiscordIcon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Discord 链接
                    </label>
                    <input
                      type="url"
                      value={socialLinks.discord}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                      placeholder="https://discord.gg/your_invite"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* GitHub */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                    <Github className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      GitHub 链接
                    </label>
                    <input
                      type="url"
                      value={socialLinks.github}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, github: e.target.value }))}
                      placeholder="https://github.com/your_account"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>


                {/* 邮箱 */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-lg">
                    <Mail className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱链接
                    </label>
                    <input
                      type="url"
                      value={socialLinks.email}
                      onChange={(e) => setSocialLinks(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="mailto:contact@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                  </div>
                </div>

                {/* 消息提示 */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 收款地址配置 */}
        <div id="payment-addresses" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">收款地址配置</h3>
            <p className="text-sm text-gray-600 mt-1">配置各区块链网络的USDT收款地址，未配置的链将不支持支付</p>
          </div>
          
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(CHAIN_INFO).map(([chainKey, chainInfo]) => {
                  const address = paymentAddresses[chainKey as keyof PaymentAddresses]
                  const isConfigured = address && address.trim() !== ''
                  
                  return (
                    <div key={chainKey} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                            <Wallet className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {chainInfo.name} (Chain ID: {chainInfo.chainId})
                            </h4>
                            <p className="text-xs text-gray-500">
                              {isConfigured ? '已配置' : '未配置 - 该链不支持支付'}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isConfigured 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isConfigured ? '可用' : '不可用'}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          USDT 收款地址
                        </label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setPaymentAddresses(prev => ({
                              ...prev,
                              [chainKey]: e.target.value
                            }))}
                            placeholder={`输入 ${chainInfo.name} 网络的USDT收款地址`}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 font-mono text-sm"
                          />
                          {address && (
                            <button
                              onClick={() => copyAddress(address, chainKey)}
                              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                              title="复制地址"
                            >
                              {copiedAddress === chainKey ? (
                                <Check className="h-4 w-4 text-green-600" />
                              ) : (
                                <Copy className="h-4 w-4 text-gray-600" />
                              )}
                            </button>
                          )}
                        </div>
                        {address && (
                          <p className="text-xs text-gray-500 font-mono break-all">
                            {address}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* 消息提示 */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* VIP会员配置 */}
        <div id="vip-config" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">VIP会员配置</h3>
            <p className="text-sm text-gray-600 mt-1">配置VIP会员的价格和有效期</p>
          </div>
          
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* VIP价格配置 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-pink-100 rounded-lg">
                        <span className="text-pink-600 font-bold text-lg">¥</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">VIP会员价格</h4>
                        <p className="text-xs text-gray-500">USDT价格</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        价格 (USDT)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={vipConfig.price}
                          onChange={(e) => setVipConfig(prev => ({
                            ...prev,
                            price: e.target.value
                          }))}
                          placeholder="300"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                        <span className="text-sm text-gray-500">USDT</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        当前价格: {vipConfig.price} USDT
                      </p>
                    </div>
                  </div>

                  {/* VIP有效期配置 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <span className="text-blue-600 font-bold text-lg">⏰</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">会员有效期</h4>
                        <p className="text-xs text-gray-500">显示文本</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        有效期描述
                      </label>
                      <input
                        type="text"
                        value={vipConfig.duration}
                        onChange={(e) => setVipConfig(prev => ({
                          ...prev,
                          duration: e.target.value
                        }))}
                        placeholder="12个月"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      />
                      <p className="text-xs text-gray-500">
                        当前显示: {vipConfig.duration}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 交易会员配置 */}
        <div id="trade-config" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">交易会员配置</h3>
            <p className="text-sm text-gray-600 mt-1">配置交易会员的价格和有效期</p>
          </div>
          
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 交易会员价格配置 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <span className="text-blue-600 font-bold text-lg">$</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">交易会员价格</h4>
                        <p className="text-xs text-gray-500">USDT价格</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        价格 (USDT)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={tradeConfig.price}
                          onChange={(e) => setTradeConfig(prev => ({
                            ...prev,
                            price: e.target.value
                          }))}
                          placeholder="300"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">USDT</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        当前价格: {tradeConfig.price} USDT
                      </p>
                    </div>
                  </div>

                  {/* 交易会员有效期配置 */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                        <span className="text-green-600 font-bold text-lg">⏰</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">会员有效期</h4>
                        <p className="text-xs text-gray-500">显示文本</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        有效期描述
                      </label>
                      <input
                        type="text"
                        value={tradeConfig.duration}
                        onChange={(e) => setTradeConfig(prev => ({
                          ...prev,
                          duration: e.target.value
                        }))}
                        placeholder="12个月"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500">
                        当前显示: {tradeConfig.duration}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 邀请比例设置 */}
        <div id="invite-ratio-config" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">邀请比例设置</h3>
            <p className="text-sm text-gray-600 mt-1">配置不同用户类型邀请VIP用户时的奖励比例</p>
          </div>
          
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* 大使邀请VIP */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg">
                        <span className="text-yellow-600 font-bold text-lg">👑</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">大使邀请VIP</h4>
                        <p className="text-xs text-gray-500">大使用户邀请VIP</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        奖励比例 (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={inviteRatioConfig.ambassadorInviteVip}
                          onChange={(e) => setInviteRatioConfig(prev => ({
                            ...prev,
                            ambassadorInviteVip: e.target.value
                          }))}
                          placeholder="50"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        当前比例: {inviteRatioConfig.ambassadorInviteVip}%
                      </p>
                    </div>
                  </div>

                  {/* VIP邀请VIP */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                        <span className="text-purple-600 font-bold text-lg">💎</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">VIP邀请VIP</h4>
                        <p className="text-xs text-gray-500">VIP用户邀请VIP</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        奖励比例 (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={inviteRatioConfig.vipInviteVip}
                          onChange={(e) => setInviteRatioConfig(prev => ({
                            ...prev,
                            vipInviteVip: e.target.value
                          }))}
                          placeholder="30"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        当前比例: {inviteRatioConfig.vipInviteVip}%
                      </p>
                    </div>
                  </div>

                  {/* 普通人邀请VIP */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                        <span className="text-blue-600 font-bold text-lg">👤</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">普通人邀请VIP</h4>
                        <p className="text-xs text-gray-500">普通用户邀请VIP</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        奖励比例 (%)
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={inviteRatioConfig.normalInviteVip}
                          onChange={(e) => setInviteRatioConfig(prev => ({
                            ...prev,
                            normalInviteVip: e.target.value
                          }))}
                          placeholder="20"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        当前比例: {inviteRatioConfig.normalInviteVip}%
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* 更多帮助 */}
        <div id="more-help-config" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">更多帮助</h3>
            <p className="text-sm text-gray-600 mt-1">配置在前台页面中展示的“更多帮助”文本</p>
          </div>
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    更多帮助文本（可选）
                  </label>
                  <textarea
                    value={moreHelpText}
                    onChange={(e) => setMoreHelpText(e.target.value)}
                    placeholder={"示例：\n如需更多帮助，请添加管理员微信..."}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                  <p className="text-xs text-gray-500">留空则不显示该文本块</p>
                </div>

                {/* 消息提示 */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 常见问题 */}
        <div id="faq-config" className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">常见问题</h3>
            <p className="text-sm text-gray-600 mt-1">配置在前台页面中展示的“常见问题”文本</p>
          </div>
          <div className="p-6">
            {loadingConfig ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">加载配置中...</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    常见问题文本（可选）
                  </label>
                  <textarea
                    value={faqText}
                    onChange={(e) => setFaqText(e.target.value)}
                    placeholder={"示例：\nQ1：如何绑定账号？\nA1：..."}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                  <p className="text-xs text-gray-500">留空则不显示该文本块</p>
                </div>

                {/* 消息提示 */}
                {message && (
                  <div className={`p-4 rounded-lg ${
                    message.type === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {message.text}
                  </div>
                )}

                {/* 保存按钮 */}
                <div className="flex justify-end">
                  <button
                    onClick={saveConfig}
                    disabled={saving}
                    className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        保存配置
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>


        {/* 消息提示 */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* 保存按钮 */}
        <div className="flex justify-end">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存配置
              </>
            )}
          </button>
        </div>

      </div>
    </AdminLayout>
  )
}
