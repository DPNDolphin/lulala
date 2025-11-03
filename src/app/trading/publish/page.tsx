'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMultiAuth } from '@/contexts/MultiAuthContext'

export default function PublishTradingPostPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useMultiAuth()

  const [type, setType] = useState<'现货' | '合约'>('现货')
  const [symbol, setSymbol] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [validUntil, setValidUntil] = useState<number | ''>('')
  const [status, setStatus] = useState<'active' | 'draft' | 'expired'>('active')
  const [loading, setLoading] = useState(false)

  const canPublish = isAuthenticated && Number(user?.can_publish_strategy) === 1

  const submit = async () => {
    if (!canPublish) {
      alert('无发布权限')
      return
    }
    if (!symbol || !title || !content) {
      alert('请填写必填项')
      return
    }
    try {
      setLoading(true)
      const form = new FormData()
      form.set('type', type)
      form.set('symbol', symbol)
      form.set('title', title)
      form.set('content', content)
      form.set('status', status)
      const ts = typeof validUntil === 'number' ? validUntil : 0
      form.set('valid_until', String(ts || 0))

      const res = await fetch('/v1/trading/create', { method: 'POST', body: form })
      const data = await res.json()
      if (data.api_code === 200) {
        alert('发布成功')
        router.push('/trading')
      } else {
        alert(data.api_msg || '发布失败')
      }
    } catch (e) {
      console.error(e)
      alert('发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">发布交易策略</h1>
      {!canPublish && (
        <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
          当前账号无发布权限
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-3">
          <button onClick={() => setType('现货')} className={`px-3 py-2 rounded border ${type==='现货'?'border-cyan-400 text-cyan-400':'border-gray-700 text-gray-300'}`}>现货</button>
          <button onClick={() => setType('合约')} className={`px-3 py-2 rounded border ${type==='合约'?'border-cyan-400 text-cyan-400':'border-gray-700 text-gray-300'}`}>合约</button>
        </div>
        <input value={symbol} onChange={e=>setSymbol(e.target.value)} placeholder="币种/交易对（如 BTC/USDT）" className="w-full px-3 py-2 rounded bg-background-card border border-gray-800" />
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="标题" className="w-full px-3 py-2 rounded bg-background-card border border-gray-800" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="图文内容（可粘贴 Markdown 文本）" rows={10} className="w-full px-3 py-2 rounded bg-background-card border border-gray-800" />
        <div className="flex items-center gap-3">
          <input
            type="date"
            className="px-3 py-2 rounded bg-background-card border border-gray-800"
            onChange={(e)=>{
              const v = e.target.value
              if (!v) { setValidUntil(''); return }
              const d = new Date(v + 'T00:00:00Z')
              setValidUntil(Math.floor(d.getTime()/1000))
            }}
          />
          <span className="text-sm text-gray-400">不选视为长期有效</span>
        </div>
        <div className="flex gap-3">
          {(['active','draft','expired'] as const).map(s => (
            <button key={s} onClick={()=>setStatus(s)} className={`px-3 py-2 rounded border ${status===s?'border-cyan-400 text-cyan-400':'border-gray-700 text-gray-300'}`}>{s}</button>
          ))}
        </div>

        <button disabled={!canPublish || loading} onClick={submit} className="px-5 py-2 rounded bg-cyan-600 text-white disabled:opacity-50">
          {loading ? '提交中...' : '提交发布'}
        </button>
      </div>
    </div>
  )
}


