'use client';

import { useState, useEffect } from 'react';
import { getReferralList, createReferralLink, updateReferralLink, deleteReferralLink, ReferralLink } from '@/lib/referralAPI';
import { useToast } from '@/components/Toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import AdminLayout from '@/components/AdminLayout';
import ExchangeLogoUploader from '@/components/ExchangeLogoUploader';

export default function ReferralManagement() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [referrals, setReferrals] = useState<ReferralLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferralLink | null>(null);
  const { showSuccess, showError, ToastContainer } = useToast();
  const [formData, setFormData] = useState<Partial<ReferralLink>>({
    exchange_name: '',
    invite_code: '',
    commission_rate: '',
    referral_url: '',
    description: '',
    exchange_type: 'CEX',
    icon_url: '',
    sort_order: 0,
    is_active: 1
  });

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
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // 认证检查
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">请先登录...</div>
      </div>
    );
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (editingItem) {
        response = await updateReferralLink(editingItem.id, formData);
      } else {
        response = await createReferralLink(formData);
      }
      
      if (response.success) {
        showSuccess(editingItem ? '更新成功' : '创建成功');
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          exchange_name: '',
          invite_code: '',
          commission_rate: '',
          referral_url: '',
          description: '',
          exchange_type: 'CEX',
          icon_url: '',
          sort_order: 0,
          is_active: 1
        });
        loadData();
      } else {
        showError(response.message || '操作失败');
      }
    } catch (error) {
      showError('操作失败');
    }
  };

  // 编辑项目
  const handleEdit = (item: ReferralLink) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  // 删除项目
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个推荐链接吗？')) return;
    
    try {
      const response = await deleteReferralLink(id);
      if (response.success) {
        showSuccess('删除成功');
        loadData();
      } else {
        showError(response.message || '删除失败');
      }
    } catch (error) {
      showError('删除失败');
    }
  };

  // 重置表单
  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      exchange_name: '',
      invite_code: '',
      commission_rate: '',
      referral_url: '',
      description: '',
      exchange_type: 'CEX',
      icon_url: '',
      sort_order: 0,
      is_active: 1
    });
  };

  return (
    <AdminLayout>
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">推荐链接管理</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          添加推荐链接
        </button>
      </div>

      {/* 数据表格 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                交易所
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                类型
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                邀请码
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                返佣比例
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  加载中...
                </td>
              </tr>
            ) : referrals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  暂无数据
                </td>
              </tr>
            ) : (
              referrals.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-gray-900">
                      <img
                        src={item.icon_url || '/icons/default-exchange.svg'}
                        alt={item.exchange_name}
                        className="w-6 h-6 mr-2"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/icons/default-exchange.svg';
                        }}
                      />
                      {item.exchange_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.exchange_type === 'CEX' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.exchange_type === 'CEX' ? '中心化' : '去中心化'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.invite_code ? (
                      <span className="font-mono bg-gray-800 text-white px-2 py-1 rounded text-xs">
                        {item.invite_code}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.commission_rate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 编辑/创建模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              {editingItem ? '编辑推荐链接' : '添加推荐链接'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    交易所名称 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.exchange_name || ''}
                    onChange={(e) => setFormData({ ...formData, exchange_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    交易所类型 *
                  </label>
                  <select
                    required
                    value={formData.exchange_type || 'CEX'}
                    onChange={(e) => setFormData({ ...formData, exchange_type: e.target.value as 'CEX' | 'DEX' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="CEX">中心化交易所 (CEX)</option>
                    <option value="DEX">去中心化交易所 (DEX)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    邀请码
                  </label>
                  <input
                    type="text"
                    value={formData.invite_code || ''}
                    onChange={(e) => setFormData({ ...formData, invite_code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    返佣比例
                  </label>
                  <input
                    type="text"
                    value={formData.commission_rate || ''}
                    onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                    placeholder="例如：现货20% 合约20%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  推荐链接
                </label>
                <input
                  type="url"
                  value={formData.referral_url || ''}
                  onChange={(e) => setFormData({ ...formData, referral_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  交易所Logo
                </label>
                <ExchangeLogoUploader
                  onUpload={(url) => setFormData({ ...formData, icon_url: url })}
                  currentImage={formData.icon_url}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  说明
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    排序权重
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    状态
                  </label>
                  <select
                    value={formData.is_active || 1}
                    onChange={(e) => setFormData({ ...formData, is_active: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value={1}>启用</option>
                    <option value={0}>禁用</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingItem ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Toast 容器 */}
      <ToastContainer />
      </div>
    </AdminLayout>
  );
}
