import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface CardSecret {
  id: string
  account: string
  password: string
  additional_info?: string
  status: string
  sold_at?: Date
  created_at: Date
}

export default function AdminCardSecretsPage() {
  const router = useRouter()
  const [cardSecrets, setCardSecrets] = useState<CardSecret[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadText, setUploadText] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    // 检查管理员认证
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus !== 'true') {
      router.push('/admin')
      return
    }
    
    fetchCardSecrets()
  }, [])

  const fetchCardSecrets = async () => {
    try {
      const productId = router.query.productId as string
      if (!productId) {
        setError('缺少产品ID，请从产品管理页面进入')
        return
      }

      console.log('Fetching card secrets for product:', productId)
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}/card-secrets`)
      const data = await response.json()
      
      if (data.success) {
        setCardSecrets(data.cardSecrets)
        setError('') // 清除错误
      } else {
        setError(data.error || '获取卡密列表失败')
      }
    } catch (error) {
      console.error('Failed to fetch card secrets:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadText.trim()) {
      setError('请输入卡密信息')
      return
    }

    setUploading(true)
    setError('')

    try {
      const productId = router.query.productId as string
      if (!productId) {
        setError('缺少产品ID')
        return
      }

      // 解析上传的卡密数据
      const lines = uploadText.trim().split('\n')
      const cardSecrets = []
      
      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue // 跳过空行
        
        // 尝试不同的分隔符
        let parts: string[] = []
        
        if (trimmedLine.includes('|')) {
          parts = trimmedLine.split('|').map(p => p.trim())
        } else if (trimmedLine.includes(',')) {
          parts = trimmedLine.split(',').map(p => p.trim())
        } else {
          // 使用空格分隔，但只分割一次
          const spaceIndex = trimmedLine.indexOf(' ')
          if (spaceIndex > 0) {
            parts = [
              trimmedLine.substring(0, spaceIndex),
              trimmedLine.substring(spaceIndex + 1)
            ]
          }
        }
        
        if (parts.length >= 2 && parts[0] && parts[1]) {
          cardSecrets.push({
            account: parts[0],
            password: parts[1],
            additionalInfo: parts[2] ? parts[2] : '请妥善保管账号信息'
          })
        }
      }

      if (cardSecrets.length === 0) {
        setError('未找到有效的卡密格式，请使用 账号 密码 格式')
        return
      }

      // 调用真实API上传
      const apiUrl = `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}/card-secrets/upload`
      console.log('API URL:', apiUrl)
      console.log('Request data:', { cardSecrets })
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cardSecrets })
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Response error:', errorText)
        setError(`上传失败: ${response.status} ${response.statusText}`)
        return
      }

      const result = await response.json()
      console.log('Response result:', result)
      
      if (result.success) {
        alert(result.message || `成功上传 ${cardSecrets.length} 个卡密！`)
        setShowUploadForm(false)
        setUploadText('')
        fetchCardSecrets()
      } else {
        setError(result.error || '上传失败')
      }
      
    } catch (error) {
      console.error('Upload failed:', error)
      setError('上传失败，请检查格式')
    } finally {
      setUploading(false)
    }
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
        <title>卡密管理 - 管理后台</title>
        <meta name="description" content="卡密管理" />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin/products" className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-flex items-center">
              ← 返回产品管理
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">卡密管理</h1>
          </div>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            上传卡密
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">批量上传卡密</h2>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">卡密数据</label>
                  <textarea
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={10}
                    placeholder="请按以下格式输入，每行一个：
账号 密码
账号 密码 备注

例如：
testuser1@gmail.com password123
testuser2@gmail.com password456 质保首登"
                    required
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-800 mb-2">📋 格式说明</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 每行一个卡密，格式：账号 密码</li>
                    <li>• 可选备注：账号 密码 备注信息</li>
                    <li>• 支持空格、逗号、竖线分隔</li>
                    <li>• 支持邮箱、用户名等各种账号格式</li>
                    <li>• 密码会自动加密存储</li>
                  </ul>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {uploading ? '上传中...' : '上传卡密'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUploadForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Card Secrets List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">卡密列表</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">密码</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">创建时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cardSecrets.map((secret) => (
                  <tr key={secret.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{secret.account}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-mono text-gray-900">
                        {secret.password.substring(0, 4)}****
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        secret.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {secret.status === 'available' ? '可用' : '已售'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(secret.created_at)}</div>
                      {secret.sold_at && (
                        <div className="text-xs text-gray-500">售出: {formatDate(secret.sold_at)}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700">
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
