'use client'

import { useState, useEffect } from 'react'
import { Rocket, Star } from 'lucide-react'
import OkxBoostCard from '@/components/OkxBoostCard'
import OkxBoostDetailModal from '@/components/OkxBoostDetailModal'

interface OkxBoostProject {
  name: string
  description: string
  url: string
  countdown: string
  endDate: string
  participants: string
  rewardAmount: string
  rewardToken: string
  imageUrl: string
  timestamp: string
  status: 'ended' | 'claiming' | 'upcoming' | 'unknown'
  details: {
    socialLinks: {
      twitter?: string
      website?: string
      discord?: string
    }
    schedule: Array<{
      title: string
      description: string
      status: string
    }>
    rewardDetails: {
      [key: string]: string
    }
    requirements: string[]
  }
}

export default function OkxBoostPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<OkxBoostProject[]>([])
  const [selectedProject, setSelectedProject] = useState<OkxBoostProject | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadOkxBoostProjects()
  }, [])

  const loadOkxBoostProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch('https://www.lulala.ai/uploads/okx_xlaunch.json')
      if (response.ok) {
        const data = await response.json()
        setProjects(data || [])
      } else {
        console.error('Failed to load OKX Boost projects')
      }
    } catch (error) {
      console.error('Error loading OKX Boost projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (project: OkxBoostProject) => {
    setSelectedProject(project)
    setShowDetailModal(true)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen relative">
        <div className="relative z-10 p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mx-auto"></div>
              <p className="text-gray-300 mt-4">加载中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      <div className="relative z-10 p-4 lg:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Rocket className="h-8 w-8 text-cyan-400" />
              <h1 className="text-3xl font-bold text-white">OKX Boost</h1>
            </div>
            <p className="text-gray-300">精选 OKX 项目启动活动与奖励任务</p>
          </div>

          <div className="space-y-6">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-black/30 backdrop-blur-sm rounded-xl p-6 animate-pulse border border-gray-700/50">
                  <div className="flex items-start space-x-4">
                    <div className="w-16 h-16 bg-gray-700 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-6 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : projects.length > 0 ? (
              projects.map((project, index) => (
                <OkxBoostCard
                  key={index}
                  project={project}
                  onViewDetails={() => handleViewDetails(project)}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-300">暂无OKX Boost项目</p>
              </div>
            )}
          </div>

          {showDetailModal && selectedProject && (
            <OkxBoostDetailModal
              project={selectedProject}
              visible={true}
              onClose={() => {
                setShowDetailModal(false)
                setSelectedProject(null)
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
