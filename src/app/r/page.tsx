'use client';

import { useState, useEffect } from 'react';
import { getReferralList, ReferralLink } from '@/lib/referralAPI';
import { useGlobalConfig } from '@/lib/useGlobalConfig';
import { useToast } from '@/components/Toast';

export default function ReferralPage() {
  const [referrals, setReferrals] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, ToastContainer } = useToast();
  const { config: globalConfig } = useGlobalConfig();

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getReferralList({ limit: 100 });
      if (response.success) {
        setReferrals(response.data.list);
      } else {
        showError('加载数据失败');
      }
    } catch (error) {
      showError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 按排序权重和ID排序
  const sortedReferrals = referrals.sort((a, b) => {
    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }
    return a.id - b.id;
  });

  // 兼容移动端的复制功能
  const copyToClipboard = async (text: string, successMessage: string) => {
    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showSuccess(successMessage);
        return;
      }
      
      // 降级方案：使用传统的 document.execCommand
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        showSuccess(successMessage);
      } else {
        throw new Error('execCommand failed');
      }
    } catch (error) {
      console.error('复制失败:', error);
      showError('复制失败，请手动复制');
    }
  };

  // 复制邀请码
  const copyInviteCode = (code: string) => {
    copyToClipboard(code, '邀请码已复制到剪贴板');
  };

  // 复制推荐链接
  const copyReferralLink = (url: string) => {
    copyToClipboard(url, '推荐链接已复制到剪贴板');
  };

  // 打开推荐链接
  const openReferralLink = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      showError('暂无推荐链接');
    }
  };

  // 检测并转换URL为链接
  const renderTextWithLinks = (text: string) => {
    if (!text) return text;
    
    // URL正则表达式，匹配http/https开头的链接
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    return text.split(urlRegex).map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            推荐链接
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            通过我们的推荐链接注册交易所，享受专属返佣优惠
          </p>
        </div>

        {/* 桌面端表格 */}
        <div className="hidden lg:block bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    交易所
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    类型
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邀请码
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    推荐链接
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    说明
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">加载中...</span>
                      </div>
                    </td>
                  </tr>
                ) : sortedReferrals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="text-gray-400 text-4xl mb-2">📊</div>
                      <p>暂无推荐链接数据</p>
                    </td>
                  </tr>
                ) : (
                  sortedReferrals.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap w-32">
                        <div className="flex items-center">
                          <img
                            src={item.icon_url || '/icons/default-exchange.svg'}
                            alt={item.exchange_name}
                            className="w-6 h-6 mr-2 rounded-lg"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/icons/default-exchange.svg';
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.exchange_name}
                            </div>
                            {item.commission_rate && (
                              <div className="text-xs text-green-600 font-medium">
                                {item.commission_rate}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-20">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.exchange_type === 'CEX' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.exchange_type === 'CEX' ? '中心化' : '去中心化'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap w-24">
                        {item.invite_code ? (
                          <span
                            onClick={() => copyInviteCode(item.invite_code!)}
                            title="点击复制邀请码"
                            className="text-sm font-mono bg-pink-100 text-pink-800 px-2 py-1 rounded cursor-pointer hover:bg-pink-200 transition-colors"
                          >
                            {item.invite_code}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 w-48">
                        {item.referral_url ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded w-32 truncate block">
                              {item.referral_url}
                            </span>
                            <button
                              onClick={() => copyReferralLink(item.referral_url!)}
                              className="text-blue-500 hover:text-blue-700 text-sm font-medium flex-shrink-0"
                            >
                              复制
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 w-80">
                        {item.description ? (
                          <span className="text-sm text-gray-600 block">
                            {item.description}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                        <div className="flex flex-col space-y-1">
                          {item.referral_url && (
                            <button
                              onClick={() => openReferralLink(item.referral_url!)}
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors text-xs w-full"
                            >
                              立即注册
                            </button>
                          )}
                          {item.invite_code && (
                            <button
                              onClick={() => copyInviteCode(item.invite_code!)}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors text-xs w-full"
                            >
                              复制邀请码
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 移动端卡片布局 */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">加载中...</span>
            </div>
          ) : sortedReferrals.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-gray-400 text-4xl mb-2">📊</div>
              <p>暂无推荐链接数据</p>
            </div>
          ) : (
            sortedReferrals.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-lg p-4">
                {/* 交易所信息 */}
                <div className="flex items-center mb-3">
                  <img
                    src={item.icon_url || '/icons/default-exchange.svg'}
                    alt={item.exchange_name}
                    className="w-10 h-10 mr-3 rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/icons/default-exchange.svg';
                    }}
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {item.exchange_name}
                    </h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      item.exchange_type === 'CEX' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.exchange_type === 'CEX' ? '中心化' : '去中心化'}
                    </span>
                  </div>
                </div>

                {/* 返佣比例 */}
                {item.commission_rate && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">返佣比例</span>
                      <span className="text-sm font-bold text-green-600">
                        {item.commission_rate}
                      </span>
                    </div>
                  </div>
                )}

                {/* 邀请码 */}
                {item.invite_code && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">邀请码</span>
                      <button
                        onClick={() => copyInviteCode(item.invite_code!)}
                        title="点击复制邀请码"
                        className="text-sm font-mono bg-pink-100 text-pink-800 px-2 py-1 rounded cursor-pointer hover:bg-pink-200 active:bg-pink-300 transition-colors touch-manipulation"
                      >
                        {item.invite_code}
                      </button>
                    </div>
                  </div>
                )}

                {/* 推荐链接 */}
                {item.referral_url && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">推荐链接</span>
                      <button
                        onClick={() => copyReferralLink(item.referral_url!)}
                        className="text-blue-500 hover:text-blue-700 active:text-blue-800 text-sm font-medium touch-manipulation px-2 py-1 rounded transition-colors"
                      >
                        复制链接
                      </button>
                    </div>
                    <div className="mt-1">
                      <button
                        onClick={() => copyReferralLink(item.referral_url!)}
                        className="text-xs font-mono bg-blue-50 text-blue-800 px-2 py-1 rounded block truncate w-full text-left hover:bg-blue-100 active:bg-blue-200 transition-colors touch-manipulation"
                      >
                        {item.referral_url}
                      </button>
                    </div>
                  </div>
                )}

                {/* 说明 */}
                {item.description && (
                  <div className="mb-3">
                    <span className="text-sm text-gray-600">
                      {item.description}
                    </span>
                  </div>
                )}

                {/* 操作按钮 */}
                <div className="flex space-x-2">
                  {item.referral_url && (
                    <button
                      onClick={() => openReferralLink(item.referral_url!)}
                      className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors font-medium text-sm touch-manipulation"
                    >
                      立即注册
                    </button>
                  )}
                  {item.invite_code && (
                    <button
                      onClick={() => copyInviteCode(item.invite_code!)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors font-medium text-sm touch-manipulation"
                    >
                      复制邀请码
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部说明 + 添加到日历 */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">使用说明</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">如何获得返佣？</h4>
              <ul className="space-y-1">
                <li>• 点击"立即注册"按钮</li>
                <li>• 完成交易所注册和实名认证</li>
                <li>• 开始交易即可享受返佣优惠</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">注意事项</h4>
              <ul className="space-y-1">
                <li>• 返佣比例以交易所实际政策为准</li>
                <li>• 部分交易所需要满足交易量要求</li>
                <li>• 如有问题请联系客服</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">合作联系</h4>
              <div>
                <a href="mailto:skheman@outlook.com" className="text-blue-600 hover:underline">skheman@outlook.com</a>
              </div>
            </div>
            {globalConfig?.more_help_text && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">更多帮助</h4>
                <p className="whitespace-pre-line">{renderTextWithLinks(globalConfig.more_help_text)}</p>
              </div>
            )}
            {globalConfig?.faq_text && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">常见问题</h4>
                <p className="whitespace-pre-line">{renderTextWithLinks(globalConfig.faq_text)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Toast 容器 */}
      <ToastContainer />
    </div>
  );
}
