'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, EyeOff, Shield, User } from 'lucide-react'
import AdminLayout from '@/components/AdminLayout'

interface AdminUser {
  id: number
  username: string
  real_name: string
  email: string
  status: number
  is_super_admin: number
  created_at: string
  updated_at: string
  permissions: any
}

interface Module {
  id: number
  module_key: string
  module_name: string
  module_icon: string
  href: string
  sort_order: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function AdminManagement() {
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [modules, setModules] = useState<Module[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    status: 1,
    permissions: {} as { [key: string]: any }
  })

  useEffect(() => {
    fetchAdmins()
    fetchModules()
  }, [pagination.page])

  const fetchAdmins = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/v1/admin/adminList?page=${pagination.page}&limit=${pagination.limit}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200) {
          setAdmins(result.data.admins)
          setPagination(result.data.pagination)
        }
      }
    } catch (error) {
      console.error('获取管理员列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchModules = async () => {
    try {
      const response = await fetch('/v1/admin/getAllModules', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200) {
          setModules(result.data.modules)
        }
      }
    } catch (error) {
      console.error('获取模块列表失败:', error)
    }
  }

  const handleCreate = () => {
    setEditingAdmin(null)
    setFormData({
      username: '',
      password: '',
      status: 1,
      permissions: {}
    })
    setShowModal(true)
  }

  const handleEdit = (admin: AdminUser) => {
    setEditingAdmin(admin)
    // 回填权限：将后端返回的权限（按模块名称）映射为以 module.id 为键的结构
    const permissionsMap: { [key: number]: any } = {}
    if (admin.is_super_admin == 1 || (admin as any).is_super_admin == '1') {
      modules.forEach(m => {
        permissionsMap[m.id] = { read: true, write: true, delete: true, manage: true }
      })
    } else if (Array.isArray(admin.permissions)) {
      modules.forEach(m => {
        const found = (admin.permissions as any[]).find(p => p && p.module === m.module_name)
        if (found && found.permissions && typeof found.permissions === 'object') {
          permissionsMap[m.id] = {
            read: found.permissions.read == true || found.permissions.read == 1 || found.permissions.read == '1',
            write: found.permissions.write == true || found.permissions.write == 1 || found.permissions.write == '1',
            delete: found.permissions.delete == true || found.permissions.delete == 1 || found.permissions.delete == '1',
            manage: found.permissions.manage == true || found.permissions.manage == 1 || found.permissions.manage == '1'
          }
        }
      })
    }
    setFormData({
      username: admin.username,
      password: '',
      status: admin.status,
      permissions: permissionsMap
    })
    setShowModal(true)
  }

  const handleDelete = async (adminId: number) => {
    if (!confirm('确定要删除这个管理员吗？')) return

    try {
      const response = await fetch('/v1/admin/adminDelete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ admin_id: adminId })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200) {
          alert('删除成功')
          fetchAdmins()
        } else {
          alert(result.api_msg)
        }
      }
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingAdmin ? '/v1/admin/adminUpdate' : '/v1/admin/adminCreate'
      const body = editingAdmin 
        ? { ...formData, admin_id: editingAdmin.id }
        : formData

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.api_code == 200) {
          alert(editingAdmin ? '更新成功' : '创建成功')
          setShowModal(false)
          fetchAdmins()
        } else {
          alert(result.api_msg)
        }
      }
    } catch (error) {
      console.error('操作失败:', error)
      alert('操作失败')
    }
  }

  const togglePermission = (moduleId: number, permissionType: string) => {
    const moduleKey = modules.find(m => m.id === moduleId)?.module_key
    if (!moduleKey) return

    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [moduleId]: {
          ...prev.permissions[moduleId],
          [permissionType]: !prev.permissions[moduleId]?.[permissionType]
        }
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">管理员管理</h1>
        <button
          onClick={handleCreate}
          className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          添加管理员
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                管理员信息
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状态
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                权限
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                创建时间
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center">
                        {admin.is_super_admin ? (
                          <Shield className="h-5 w-5 text-pink-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.username}
                        {admin.is_super_admin && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                            超级管理员
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    admin.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {admin.status ? '启用' : '禁用'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">
                    {admin.is_super_admin ? (
                      '拥有所有权限'
                    ) : (
                      <div className="space-y-1">
                        {Array.isArray(admin.permissions) && admin.permissions.map((perm: any, index: number) => (
                          <div key={index} className="text-xs">
                            {perm.module}: {Object.keys(perm.permissions).filter(k => perm.permissions[k]).join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(admin.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button
                    onClick={() => handleEdit(admin)}
                    className="text-pink-600 hover:text-pink-900"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {!admin.is_super_admin && (
                    <button
                      onClick={() => handleDelete(admin.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 分页 */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            显示第 {(pagination.page - 1) * pagination.limit + 1} 到 {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共 {pagination.total} 条
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {/* 创建/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingAdmin ? '编辑管理员' : '创建管理员'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户名 *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    密码 {editingAdmin ? '(留空则不修改)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                    required={!editingAdmin}
                  />
                </div>
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                >
                  <option value={1}>启用</option>
                  <option value={0}>禁用</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  权限配置
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                  {modules.map((module) => (
                    <div key={module.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                      <div className="font-medium text-sm text-gray-900 mb-2">
                        {module.module_name}
                      </div>
                      <div className="flex space-x-4">
                        {['read', 'write', 'delete', 'manage'].map((permType) => (
                          <label key={permType} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.permissions[module.id]?.[permType] || false}
                              onChange={() => togglePermission(module.id, permType)}
                              className="mr-1"
                            />
                            <span className="text-sm text-gray-600">
                              {permType === 'read' ? '查看' : 
                               permType === 'write' ? '编辑' : 
                               permType === 'delete' ? '删除' : '管理'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  {editingAdmin ? '更新' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  )
}
