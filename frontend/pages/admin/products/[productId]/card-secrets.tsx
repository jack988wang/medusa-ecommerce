import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface CardSecret {
  id: string
  card_secret_masked: string
  card_secret_full?: string
  remark: string
  status: 'available' | 'used'
  upload_time: Date
  used_time?: Date
  used_order_id?: string
}

interface CardSecretData {
  total_available: number
  total_used: number
  card_secrets: CardSecret[]
}

interface UploadTemplate {
  type: 'single_product' | 'multi_product'
  headers: string[]
  example_data: any[][]
  instructions: string[]
}

export default function CardSecretManagementPage() {
  const router = useRouter()
  const { productId } = router.query

  const [cardSecretData, setCardSecretData] = useState<CardSecretData | null>(null)
  const [templates, setTemplates] = useState<{ single_product: UploadTemplate; multi_product: UploadTemplate } | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'used'>('all')
  const [showFullSecrets, setShowFullSecrets] = useState<{ [key: string]: boolean }>({})
  const [error, setError] = useState('')

  useEffect(() => {
    if (productId) {
      fetchCardSecrets()
      fetchTemplates()
    }
  }, [productId, statusFilter])

  const fetchCardSecrets = async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}/card-secrets?${params}`
      )
      const data = await response.json()
      
      if (data.success) {
        setCardSecretData(data.data)
      } else {
        setError('获取卡密数据失败')
      }
    } catch (error) {
      console.error('Failed to fetch card secrets:', error)
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/card-secrets/templates`)
      const data = await response.json()
      if (data.success) {
        setTemplates(data.templates)
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    }
  }

  const generateTemplateCSV = (template: UploadTemplate) => {
    const csvContent = [
      template.headers.join(','),
      ...template.example_data.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `card_secret_template_${template.type}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUpload = async () => {
    if (!uploadText.trim()) {
      alert('请输入卡密数据')
      return
    }

    setUploading(true)
    setError('')

    try {
      // 解析CSV数据
      const lines = uploadText.trim().split('\n')
      const cardSecrets = []

      for (let i = 1; i < lines.length; i++) { // 跳过标题行
        const line = lines[i].trim()
        if (!line) continue

        const columns = line.split(',')
        if (columns.length >= 1) {
          const cardSecret = columns[0].trim()
          const remark = columns[1]?.trim() || ''
          
          if (cardSecret) {
            cardSecrets.push({ card_secret: cardSecret, remark })
          }
        }
      }

      if (cardSecrets.length === 0) {
        alert('未找到有效的卡密数据')
        return
      }

      // 上传卡密
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}/card-secrets/upload`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ card_secrets: cardSecrets })
        }
      )

      const result = await response.json()

      if (result.success && result.results) {
        const { total, successful, failed, errors } = result.results
        let message = `上传完成！\n总计: ${total} 条\n成功: ${successful} 条\n失败: ${failed} 条`
        
        if (errors.length > 0) {
          message += '\n\n失败详情:\n' + errors.slice(0, 5).map(
            (error: any) => `第${error.row}行: ${error.error}`
          ).join('\n')
          
          if (errors.length > 5) {
            message += `\n... 还有 ${errors.length - 5} 个错误`
          }
        }

        alert(message)
        setShowUploadModal(false)
        setUploadText('')
        fetchCardSecrets() // 重新加载数据
      } else {
        alert(result.error || '上传失败')
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('网络错误，请重试')
    } finally {
      setUploading(false)
    }
  }

  const deleteCardSecret = async (cardSecretId: string) => {
    if (!confirm('确认删除此卡密？删除后无法恢复。')) return

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/card-secrets/${cardSecretId}`,
        { method: 'DELETE' }
      )

      const result = await response.json()
      if (result.success) {
        fetchCardSecrets() // 重新加载数据
      } else {
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('Delete failed:', error)
      alert('网络错误，请重试')
    }
  }

  const exportCardSecrets = async (format: 'csv' | 'xlsx') => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        format,
        includeUsedInfo: 'true'
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}/card-secrets/export?${params}`
      )
      const result = await response.json()

      if (result.success) {
        // 模拟下载
        const dataStr = JSON.stringify(result.data, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename || `card_secrets.${format}`
        link.click()
        URL.revokeObjectURL(url)
      } else {
        alert(result.error || '导出失败')
      }
    } catch (error) {
      console.error('Export failed:', error)
      alert('网络错误，请重试')
    }
  }

  const toggleShowFull = (cardSecretId: string) => {
    setShowFullSecrets(prev => ({
      ...prev,
      [cardSecretId]: !prev[cardSecretId]
    }))
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>卡密管理 - 卡密商城后台</title>
        <meta name="description" content="卡密管理" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/admin/products" className="text-orange-600 hover:text-orange-700">
                ← 返回商品管理
              </Link>
              <h1 className="text-xl font-bold text-gray-900">卡密管理</h1>
              <span className="text-sm text-gray-500">商品ID: {productId}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 统计卡片 */}
        {cardSecretData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">未使用卡密</p>
                  <p className="text-2xl font-bold text-green-600">{cardSecretData.total_available}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">已使用卡密</p>
                  <p className="text-2xl font-bold text-gray-600">{cardSecretData.total_used}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">总计卡密</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {cardSecretData.total_available + cardSecretData.total_used}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 操作工具栏 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              {/* 筛选 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">状态筛选:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">全部</option>
                  <option value="available">未使用</option>
                  <option value="used">已使用</option>
                </select>
              </div>

              {/* 导出 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportCardSecrets('csv')}
                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm"
                >
                  导出CSV
                </button>
                <button
                  onClick={() => exportCardSecrets('xlsx')}
                  className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-sm"
                >
                  导出Excel
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* 模板下载 */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">模板下载:</span>
                <button
                  onClick={() => templates && generateTemplateCSV(templates.single_product)}
                  className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 text-sm"
                >
                  单商品模板
                </button>
              </div>

              {/* 上传按钮 */}
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                + 批量上传卡密
              </button>
            </div>
          </div>
        </div>

        {/* 卡密列表 */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              卡密列表 ({cardSecretData?.card_secrets.length || 0})
            </h2>
          </div>

          {cardSecretData && cardSecretData.card_secrets.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      卡密内容
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      备注
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传时间
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      使用信息
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cardSecretData.card_secrets.map((cardSecret) => (
                    <tr key={cardSecret.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-sm">
                          <div className="flex items-center space-x-2">
                            <span className={showFullSecrets[cardSecret.id] ? '' : 'select-none'}>
                              {showFullSecrets[cardSecret.id] 
                                ? (cardSecret.card_secret_full || cardSecret.card_secret_masked)
                                : cardSecret.card_secret_masked
                              }
                            </span>
                            <button
                              onClick={() => toggleShowFull(cardSecret.id)}
                              className="text-xs text-blue-600 hover:text-blue-700"
                            >
                              {showFullSecrets[cardSecret.id] ? '隐藏' : '显示'}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{cardSecret.remark}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cardSecret.status === 'available' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {cardSecret.status === 'available' ? '未使用' : '已使用'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {formatDate(cardSecret.upload_time)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cardSecret.status === 'used' ? (
                          <div className="text-sm">
                            <div className="text-gray-900">
                              {cardSecret.used_time && formatDate(cardSecret.used_time)}
                            </div>
                            {cardSecret.used_order_id && (
                              <div className="text-gray-500 font-mono text-xs">
                                订单: {cardSecret.used_order_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {cardSecret.status === 'available' && (
                          <button
                            onClick={() => deleteCardSecret(cardSecret.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            删除
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-gray-500 mb-4">暂无卡密数据</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
              >
                上传第一批卡密
              </button>
            </div>
          )}
        </div>

        {/* 上传弹窗 */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">批量上传卡密</h3>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-4">
                {/* 模板说明 */}
                {templates && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">📋 填写格式说明</h4>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h5 className="text-sm font-medium text-blue-800 mb-2">CSV格式示例：</h5>
                      <div className="font-mono text-xs text-blue-700 bg-white border rounded p-2 mb-3">
                        {templates.single_product.headers.join(',')}<br/>
                        {templates.single_product.example_data.map(row => row.join(',')).join('\n')}
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        {templates.single_product.instructions.map((instruction, index) => (
                          <p key={index}>• {instruction}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 上传区域 */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    卡密数据 (CSV格式)
                  </label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="粘贴CSV格式的卡密数据，或拖拽文件到此处"
                    rows={10}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    支持拖拽CSV/Excel文件，或直接粘贴CSV格式文本
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:bg-gray-100"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading || !uploadText.trim()}
                    className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400"
                  >
                    {uploading ? '上传中...' : '开始上传'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
