import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface Order {
  id: string
  order_number: string
  contact_info: string
  product_title: string
  quantity: number
  unit_price: number
  total_amount: number
  currency: string
  payment_status: string
  payment_method?: string
  card_secret_delivered_at?: Date
  created_at: Date
}

interface CardSecret {
  account: string
  password: string
  additionalInfo?: string
  qualityGuarantee: string
}

export default function QueryOrdersPage() {
  const [contactInfo, setContactInfo] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)
  const [cardSecrets, setCardSecrets] = useState<{ [orderId: string]: CardSecret }>({})
  const [loadingCardSecret, setLoadingCardSecret] = useState<{ [orderId: string]: boolean }>({})
  const [showCardSecret, setShowCardSecret] = useState<{ [orderId: string]: boolean }>({})
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contactInfo.trim()) {
      setError('请输入邮箱地址')
      return
    }

    // 简单邮箱验证
    if (!contactInfo.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    setLoading(true)
    setError('')
    setOrders([])

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/orders/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactInfo: contactInfo.trim()
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setOrders(data.orders || [])
        setSearched(true)
      } else {
        setError(data.error || '查询失败')
      }
    } catch (error) {
      console.error('Query failed:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 获取卡密信息
  const fetchCardSecret = async (orderId: string) => {
    setLoadingCardSecret(prev => ({ ...prev, [orderId]: true }))
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/orders/${orderId}/card-secret?email=${encodeURIComponent(contactInfo)}`
      )
      const data = await response.json()
      
      if (data.success) {
        setCardSecrets(prev => ({ ...prev, [orderId]: data.cardSecret }))
        setShowCardSecret(prev => ({ ...prev, [orderId]: true }))
      } else {
        alert(data.error || '获取卡密失败')
      }
    } catch (error) {
      console.error('Failed to fetch card secret:', error)
      alert('网络错误，请重试')
    } finally {
      setLoadingCardSecret(prev => ({ ...prev, [orderId]: false }))
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [key]: true })
      setTimeout(() => {
        setCopied({ ...copied, [key]: false })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('复制失败，请手动选择复制')
    }
  }

  // 下载卡密信息
  const downloadCardSecret = (order: Order, cardSecret: CardSecret) => {
    const content = `订单信息：
订单号：${order.order_number}
商品：${order.product_title}
价格：${formatPrice(order.total_amount, order.currency)}
支付时间：${formatDate(order.created_at)}

卡密信息：
账号：${cardSecret.account}
密码：${cardSecret.password}
备注：${cardSecret.additionalInfo || '无'}
质保说明：${cardSecret.qualityGuarantee}

重要提醒：
• 请妥善保管您的账号密码信息
• 建议立即修改密码以确保安全
• 虚拟商品一经售出，非质量问题不退款`

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `卡密信息_${order.order_number}.txt`
    link.click()
    URL.revokeObjectURL(url)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'failed':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return '已支付'
      case 'pending':
        return '待支付'
      case 'failed':
        return '支付失败'
      case 'cancelled':
        return '已取消'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>订单查询 - 卡密商城</title>
        <meta name="description" content="查询您的订单状态和卡密信息" />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-flex items-center">
            ← 返回首页
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">订单查询</h1>
        </div>

        {/* Query Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">查询订单</h2>
          
          <form onSubmit={handleQuery} className="space-y-4">
            <div>
              <label htmlFor="contactInfo" className="block text-sm font-medium text-gray-700 mb-2">
                邮箱地址
              </label>
              <input
                type="email"
                id="contactInfo"
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="请输入下单时填写的邮箱地址"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 text-white py-3 px-6 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '查询中...' : '查询订单'}
            </button>
          </form>
        </div>

        {/* Results */}
        {searched && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              查询结果 {orders.length > 0 && `(${orders.length} 个订单)`}
            </h3>
            
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📝</div>
                <p className="text-gray-500 text-lg mb-2">未找到相关订单</p>
                <p className="text-gray-400 text-sm">请检查邮箱地址是否正确</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-6 hover:border-orange-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg">{order.product_title}</h4>
                        <p className="text-sm text-gray-500">订单号: {order.order_number}</p>
                        <p className="text-sm text-gray-500">下单时间: {formatDate(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900 mb-1">
                          {formatPrice(order.total_amount, order.currency)}
                        </div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                          {getStatusText(order.payment_status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">商品信息</h4>
                      <p className="text-gray-700 text-sm">{order.product_title}</p>
                      
                      {order.payment_method && (
                        <p className="text-xs text-gray-500 mt-2">
                          支付方式: {order.payment_method}
                        </p>
                      )}
                      
                      {order.card_secret_delivered_at && (
                        <div className="mt-4 space-y-3">
                          <div className="bg-green-50 border border-green-200 rounded-md p-3">
                            <p className="text-green-700 text-sm flex items-center">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              卡密已发放 ({formatDate(order.card_secret_delivered_at)})
                            </p>
                          </div>

                          {/* 卡密操作按钮 */}
                          <div className="flex gap-3">
                            <button
                              onClick={() => fetchCardSecret(order.id)}
                              disabled={loadingCardSecret[order.id]}
                              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm flex items-center justify-center"
                            >
                              {loadingCardSecret[order.id] ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              ) : (
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                              {showCardSecret[order.id] ? '隐藏卡密' : '查看卡密'}
                            </button>
                            
                            {cardSecrets[order.id] && (
                              <button
                                onClick={() => downloadCardSecret(order, cardSecrets[order.id])}
                                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 text-sm flex items-center justify-center"
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                下载卡密
                              </button>
                            )}
                          </div>

                          {/* 卡密信息显示 */}
                          {showCardSecret[order.id] && cardSecrets[order.id] && (
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                              <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                                🔑 卡密信息
                                <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                  已激活
                                </span>
                              </h5>
                              
                              <div className="space-y-3">
                                {/* 账号 */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-600">账号</label>
                                    <button
                                      onClick={() => copyToClipboard(cardSecrets[order.id].account, `${order.id}_account`)}
                                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      {copied[`${order.id}_account`] ? '已复制!' : '复制'}
                                    </button>
                                  </div>
                                  <div className="bg-white rounded p-2 font-mono text-sm border">
                                    {cardSecrets[order.id].account}
                                  </div>
                                </div>

                                {/* 密码 */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-medium text-gray-600">密码</label>
                                    <button
                                      onClick={() => copyToClipboard(cardSecrets[order.id].password, `${order.id}_password`)}
                                      className="text-xs text-orange-600 hover:text-orange-700 flex items-center"
                                    >
                                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                      </svg>
                                      {copied[`${order.id}_password`] ? '已复制!' : '复制'}
                                    </button>
                                  </div>
                                  <div className="bg-white rounded p-2 font-mono text-sm border">
                                    {cardSecrets[order.id].password}
                                  </div>
                                </div>

                                {/* 质保说明 */}
                                <div className="bg-blue-50 rounded p-3">
                                  <h6 className="text-xs font-medium text-blue-800 mb-1">📋 质保说明</h6>
                                  <p className="text-xs text-blue-700">{cardSecrets[order.id].qualityGuarantee}</p>
                                  {cardSecrets[order.id].additionalInfo && (
                                    <p className="text-xs text-blue-600 mt-1">{cardSecrets[order.id].additionalInfo}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {order.payment_status === 'paid' && !order.card_secret_delivered_at && (
                        <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                          <p className="text-yellow-700 text-sm">
                            ⏳ 卡密正在处理中，请稍候...
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-bold text-blue-800 mb-4">需要帮助？</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• 请输入下单时使用的邮箱地址查询所有订单</li>
            <li>• 已支付订单可以查看和下载卡密信息</li>
            <li>• 建议下载卡密文件备份，避免信息丢失</li>
            <li>• 如有其他问题，请联系客服获取帮助</li>
          </ul>
        </div>
      </div>
    </div>
  )
}