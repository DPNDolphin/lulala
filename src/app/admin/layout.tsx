import type { Metadata } from 'next'
import '../globals.css'
import { AuthProvider } from '@/contexts/AdminAuthContext'

export const metadata: Metadata = {
  title: '管理后台 | 区块链投研平台',
  description: '管理后台系统',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AuthProvider>
        {children}
      </AuthProvider>
    </div>
  )
}