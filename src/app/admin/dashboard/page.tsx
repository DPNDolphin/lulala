'use client'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import AdminLayout from '@/components/AdminLayout'
import { 
  Users, 
  FileText, 
  Eye, 
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalUsers: number
  totalReports: number
  totalViews: number
  activeUsers: number
}

export default function AdminDashboard() {
  const { isAuthenticated, loading } = useAdminAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalReports: 0,
    totalViews: 0,
    activeUsers: 0
  })

  useEffect(() => {
    // TODO: 从API获取真实的统计数据
    setStats({
      totalUsers: 0,
      totalReports: 0,
      totalViews: 0,
      activeUsers: 0
    })
  }, [])

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

  const statsCards = [
    {
      title: '总用户数',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: '投研报告',
      value: stats.totalReports,
      icon: FileText,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: '总阅读量',
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: 'bg-purple-500',
      change: '+24%'
    },
    {
      title: '活跃用户',
      value: stats.activeUsers,
      icon: Activity,
      color: 'bg-pink-500',
      change: '+15%'
    }
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来！</h2>
          <p className="text-gray-600">这里是您的管理后台概览</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((card, index) => (
            <div key={index} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-full`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-500 font-medium">{card.change}</span>
                <span className="text-sm text-gray-500 ml-2">较上月</span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Latest Reports */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">最新报告</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <p>暂无报告数据</p>
                <p className="text-sm mt-2">待接入API后显示真实数据</p>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">系统状态</h3>
            </div>
            <div className="p-6">
              <div className="text-center text-gray-500 py-8">
                <p>系统状态监控</p>
                <p className="text-sm mt-2">待接入监控API后显示真实状态</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">快速操作</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/admin/reports/create"
              className="flex items-center justify-center px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
            >
              <FileText className="h-5 w-5 mr-2" />
              创建新报告
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              用户管理
            </Link>
            <Link
              href="/admin/content"
              className="flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Calendar className="h-5 w-5 mr-2" />
              查看内容
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}