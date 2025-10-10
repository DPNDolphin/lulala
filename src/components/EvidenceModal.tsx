'use client'

import { useState, useEffect } from 'react'
import { X, ThumbsUp, ThumbsDown, Link, Image as ImageIcon, FileText, Plus, Send, Loader } from 'lucide-react'
import { getEvidence, addEvidence, Evidence, AddEvidenceData } from '@/lib/rumorsAPI'
import { useMultiAuth } from '@/contexts/MultiAuthContext'
import { useToast } from '@/components/Toast'
import EvidenceInput from '@/components/EvidenceInput'

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  rumorId: string
  rumorTitle: string
}

export default function EvidenceModal({ isOpen, onClose, rumorId, rumorTitle }: EvidenceModalProps) {
  const { isAuthenticated, user } = useMultiAuth()
  const { showWarning, showSuccess, showError, ToastContainer } = useToast()
  
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  
  // 新证据表单
  const [newEvidenceContent, setNewEvidenceContent] = useState('')
  const [newEvidenceDescription, setNewEvidenceDescription] = useState('')
  const [evidenceType, setEvidenceType] = useState<'support' | 'oppose'>('support')

  // 加载证据列表
  const loadEvidence = async () => {
    if (!rumorId) return
    
    setLoading(true)
    try {
      const data = await getEvidence({
        rumor_id: parseInt(rumorId),
        status: 'approved'
      })
      setEvidenceList(data.evidence_list || [])
    } catch (error) {
      console.error('加载证据失败:', error)
      showError('加载失败', '无法加载证据列表')
    } finally {
      setLoading(false)
    }
  }

  // 提交新证据
  const handleSubmitEvidence = async () => {
    if (!isAuthenticated) {
      showWarning('需要登录', '请先登录才能提交证据')
      return
    }

    if (!newEvidenceContent.trim()) {
      showWarning('输入错误', '请输入证据内容')
      return
    }

    setSubmitting(true)
    try {
      const evidenceData: AddEvidenceData = {
        rumor_id: parseInt(rumorId),
        evidence_content: newEvidenceContent.trim(),
        evidence_description: newEvidenceDescription.trim() || undefined,
        evidence_direction: evidenceType
      }

      await addEvidence(evidenceData)
      
      // 清空表单
      setNewEvidenceContent('')
      setNewEvidenceDescription('')
      setShowAddForm(false)
      
      // 重新加载证据列表
      await loadEvidence()
      
      showSuccess('提交成功', '证据已提交，等待审核')
    } catch (error) {
      console.error('提交证据失败:', error)
      showError('提交失败', '请重试')
    } finally {
      setSubmitting(false)
    }
  }


  // 获取证据类型图标
  const getEvidenceTypeIcon = (type: string) => {
    switch (type) {
      case 'link':
        return <Link className="h-4 w-4" />
      case 'image':
        return <ImageIcon className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    return date.toLocaleDateString()
  }

  useEffect(() => {
    if (isOpen && rumorId) {
      loadEvidence()
    }
  }, [isOpen, rumorId])

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-background-secondary/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
        <div className="bg-background-secondary rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-700">
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-background-secondary/95">
            <div>
              <h2 className="text-xl font-semibold text-text-primary">证据列表</h2>
              <p className="text-sm text-text-muted mt-1">{rumorTitle}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-background-card rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-6 bg-background-secondary">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-6 w-6 animate-spin text-pink-400" />
                <span className="ml-2 text-text-secondary">加载中...</span>
              </div>
            ) : evidenceList.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-text-muted mx-auto mb-4" />
                <p className="text-text-muted">暂无证据</p>
                <p className="text-sm text-text-muted mt-1">成为第一个提供证据的人</p>
              </div>
            ) : (
              <div className="space-y-4">
                {evidenceList.map((evidence) => (
                  <div key={evidence.id} className="bg-background-card rounded-lg p-4 border border-gray-700 shadow-sm">
                    {/* 证据头部 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        {getEvidenceTypeIcon(evidence.evidence_type)}
                        <span className="text-sm text-text-secondary">
                          {evidence.evidence_type === 'link' ? '链接' : 
                           evidence.evidence_type === 'image' ? '图片' : '文本'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          evidence.evidence_direction === 'support' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {evidence.evidence_direction === 'support' ? '支持证据' : '反对证据'}
                        </span>
                        {evidence.is_initial && (
                          <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full">
                            初始证据
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-text-muted">
                        {formatTime(evidence.created_at)}
                      </span>
                    </div>

                    {/* 证据内容 */}
                    <div className="mb-3">
                      {evidence.evidence_type === 'link' ? (
                        <a
                          href={evidence.evidence_content}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 break-all"
                        >
                          {evidence.evidence_content}
                        </a>
                      ) : evidence.evidence_type === 'image' ? (
                        <div className="space-y-2">
                          <img
                            src={evidence.evidence_content}
                            alt="证据图片"
                            className="max-w-full h-auto max-h-64 rounded-lg object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      ) : (
                        <p className="text-text-primary whitespace-pre-wrap">
                          {evidence.evidence_content}
                        </p>
                      )}
                      
                      {evidence.evidence_description && (
                        <p className="text-sm text-text-muted mt-2">
                          {evidence.evidence_description}
                        </p>
                      )}
                    </div>

                    {/* 提交者信息 */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-secondary">
                        提交者: {evidence.submitter_name}
                      </span>
                      {evidence.submitter_vip_level && evidence.submitter_vip_level > 0 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          VIP{evidence.submitter_vip_level}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部添加证据区域 */}
          <div className="border-t border-gray-700 p-6 bg-background-secondary">
            {!showAddForm ? (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-lg font-medium transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>添加证据</span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* 证据类型选择 */}
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setEvidenceType('support')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      evidenceType === 'support'
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-background-secondary text-text-secondary border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>支持证据</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvidenceType('oppose')}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                      evidenceType === 'oppose'
                        ? 'bg-red-100 text-red-700 border border-red-300'
                        : 'bg-background-secondary text-text-secondary border border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>反对证据</span>
                  </button>
                </div>

                {/* 证据输入 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    证据内容 <span className="text-red-400">*</span>
                  </label>
                  <EvidenceInput
                    value={newEvidenceContent}
                    onChange={setNewEvidenceContent}
                  />
                </div>

                {/* 证据描述 */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    证据描述 <span className="text-text-muted">(可选)</span>
                  </label>
                  <textarea
                    value={newEvidenceDescription}
                    onChange={(e) => setNewEvidenceDescription(e.target.value)}
                    placeholder="简要描述这个证据..."
                    className="w-full bg-background-secondary border border-gray-600 rounded-lg p-3 text-text-primary placeholder-text-muted focus:border-pink-400 focus:outline-none resize-none"
                    rows={3}
                    maxLength={500}
                  />
                </div>

                {/* 提交按钮 */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleSubmitEvidence}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 disabled:opacity-50 text-white rounded-lg font-medium transition-all"
                  >
                    {submitting ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>提交证据</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false)
                      setNewEvidenceContent('')
                      setNewEvidenceDescription('')
                    }}
                    className="px-6 py-2 bg-background-secondary border border-gray-700 text-text-secondary rounded-lg hover:bg-background-card transition-all"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  )
}
