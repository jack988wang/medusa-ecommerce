import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface EmailStats {
  totalEmails: number
  uniqueEmails: number
  emailList: Array<{
    email: string
    orderCount: number
    totalAmount: number
    firstOrderDate: Date
    lastOrderDate: Date
    orders: Array<{
      id: string
      order_number: string
      product_title: string
      price: number
      currency: string
      payment_status: string
      created_at: Date
    }>
  }>
}

export default function EmailStatsPage() {
  const router = useRouter()
  const [emailStats, setEmailStats] = useState<EmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<string>('')
  const [showEmailDetails, setShowEmailDetails] = useState(false)

  useEffect(() => {
    // 检查管理员认证
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus !== 'true') {
      router.push('/admin')
      return
    }
    
    fetchEmailStats()
  }, [])

  const fetchEmailStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/email-stats`)
      const data = await response.json()
      
      if (data.success) {
        setEmailStats(data.emailStats)
      } else {
        setError('获取邮箱统计失败')
      }
    } catch (error) {
      console.error('Failed to fetch email stats:', error)
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    if (currency === 'CNY') {
      return `¥${(amount / 100).toFixed(2)}`
    }
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount / 100)
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleViewEmailDetails = (email: string) => {
    setSelectedEmail(email)
    setShowEmailDetails(true)
  }

  const exportEmailList = () => {
    if (!emailStats) return

    const csvContent = [
      ['邮箱地址', '订单数量', '总金额', '首次下单时间', '最后下单时间'].join(','),
      ...emailStats.emailList.map(item => [
        item.email,
        item.orderCount,
        formatPrice(item.totalAmount, 'CNY'),
        formatDate(item.firstOrderDate),
        formatDate(item.lastOrderDate)
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `邮箱统计_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
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
        <title>邮箱统计 - 管理后台</title>
        <meta name="description" content="邮箱统计管理" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-flex items-center">
              ← 返回管理后台
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">邮箱统计</h1>
            <p className="text-gray-600 mt-2">查看所有下单用户的邮箱统计信息</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportEmailList}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              导出CSV
            </button>
            <button
              onClick={fetchEmailStats}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              刷新
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchEmailStats}
              className="mt-2 text-red-700 hover:text-red-800 text-sm underline"
            >
              重试
            </button>
          </div>
        )}

        {emailStats && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总邮箱数</p>
                    <p className="text-2xl font-bold text-gray-900">{emailStats.totalEmails}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">唯一邮箱数</p>
                    <p className="text-2xl font-bold text-gray-900">{emailStats.uniqueEmails}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">总订单金额</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ¥{(emailStats.emailList.reduce((sum, item) => sum + item.totalAmount, 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 邮箱列表表格 */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">邮箱统计列表</h2>
                <p className="text-sm text-gray-600 mt-1">按总消费金额排序</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">邮箱地址</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">订单数量</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">总金额</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">首次下单</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">最后下单</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailStats.emailList.map((item, index) => (
                      <tr key={item.email} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-orange-600 font-medium text-sm">
                                {item.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{item.email}</div>
                              <div className="text-xs text-gray-500">#{index + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.orderCount} 单
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.totalAmount, 'CNY')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(item.firstOrderDate)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{formatDate(item.lastOrderDate)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleViewEmailDetails(item.email)}
                            className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700"
                          >
                            查看详情
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {emailStats.emailList.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📧</div>
                <p className="text-gray-500 text-lg mb-2">暂无邮箱数据</p>
                <p className="text-gray-400 text-sm">还没有用户下单</p>
              </div>
            )}
          </>
        )}

        {/* 邮箱详情模态框 */}
        {showEmailDetails && selectedEmail && emailStats && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  邮箱详情: {selectedEmail}
                </h2>
                <button
                  onClick={() => setShowEmailDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {(() => {
                const emailData = emailStats.emailList.find(item => item.email === selectedEmail)
                if (!emailData) return null

                return (
                  <div className="space-y-6">
                    {/* 邮箱统计信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800">订单总数</h3>
                        <p className="text-2xl font-bold text-blue-900">{emailData.orderCount}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-green-800">总消费金额</h3>
                        <p className="text-2xl font-bold text-green-900">
                          {formatPrice(emailData.totalAmount, 'CNY')}
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-yellow-800">平均订单金额</h3>
                        <p className="text-2xl font-bold text-yellow-900">
                          {formatPrice(emailData.totalAmount / emailData.orderCount, 'CNY')}
                        </p>
                      </div>
                    </div>

                    {/* 订单列表 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">订单历史</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">订单号</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">商品</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">金额</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">下单时间</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {emailData.orders.map((order) => (
                              <tr key={order.id}>
                                <td className="px-4 py-2 text-sm font-mono text-gray-900">
                                  {order.order_number}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {order.product_title}
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {formatPrice(order.price, order.currency)}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    order.payment_status === 'paid' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {order.payment_status === 'paid' ? '已支付' : '待支付'}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm text-gray-900">
                                  {formatDate(order.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
