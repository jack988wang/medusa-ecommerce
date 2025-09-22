import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  currency: string
  stock: number
  sold_count: number
  quality_guarantee: string
  attributes: string[]
}

export default function PurchasePage() {
  const router = useRouter()
  const { id } = router.query
  const [product, setProduct] = useState<Product | null>(null)
  const [contactInfo, setContactInfo] = useState('')
  const [contactType, setContactType] = useState<'email' | 'phone'>('email')
  const [paymentType, setPaymentType] = useState<'alipay' | 'wechat'>('alipay')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/products`)
      const data = await response.json()
      if (data.success) {
        const foundProduct = data.products.find((p: Product) => p.id === id)
        if (foundProduct) {
          setProduct(foundProduct)
        } else {
          setError('商品不存在')
        }
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      setError('加载商品信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!product) return
    
    if (!contactInfo.trim()) {
      setError('请输入联系方式')
      return
    }

    // 简单验证
    if (contactType === 'email' && !contactInfo.includes('@')) {
      setError('请输入有效的邮箱地址')
      return
    }

    if (contactType === 'phone' && !/^1[3-9]\d{9}$/.test(contactInfo)) {
      setError('请输入有效的手机号码')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactInfo: contactInfo.trim(),
          productId: product.id,
          productTitle: product.title,
          quantity,
          unitPrice: product.price,
          currency: product.currency || 'CNY',
          paymentType: paymentType
        })
      })

      const result = await response.json()

      if (result.success && result.payUrl) {
        // 跳转到支付中转页，避免直接跨域跳转被拦截
        router.push(`/payment/redirect?url=${encodeURIComponent(result.payUrl)}`)
      } else {
        setError(result.error || '创建订单失败')
      }
    } catch (error) {
      console.error('Order creation failed:', error)
      setError('网络错误，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{error}</p>
          <Link href="/" className="text-orange-600 hover:text-orange-700">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>购买商品 - {product.title}</title>
        <meta name="description" content={`购买 ${product.title}`} />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-orange-600 hover:text-orange-700">
              ← 返回商城
            </Link>
            <h1 className="text-xl font-bold text-gray-900">确认购买</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">商品信息</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">{product.title}</h3>
                <p className="text-gray-600 text-sm">{product.description}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {product.attributes.map((attr, index) => (
                  <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {attr}
                  </span>
                ))}
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">单价:</span>
                  <span className="text-2xl font-bold text-red-600">¥{product.price / 100}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">库存:</span>
                  <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                    {product.stock}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">质保:</span>
                  <span className="text-gray-900">{product.quality_guarantee}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">下单信息</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  联系方式类型
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="email"
                      checked={contactType === 'email'}
                      onChange={(e) => setContactType(e.target.value as 'email')}
                      className="mr-2"
                    />
                    邮箱
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="phone"
                      checked={contactType === 'phone'}
                      onChange={(e) => setContactType(e.target.value as 'phone')}
                      className="mr-2"
                    />
                    手机号
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {contactType === 'email' ? '邮箱地址' : '手机号码'}
                </label>
                <input
                  type={contactType === 'email' ? 'email' : 'tel'}
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder={contactType === 'email' ? '请输入邮箱地址' : '请输入手机号码'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  {contactType === 'email' ? '卡密将发送到此邮箱' : '订单信息将发送到此手机'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  购买数量
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="text-lg font-medium">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                    disabled={quantity >= product.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  支付方式
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label 
                    className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      paymentType === 'alipay' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="alipay"
                      checked={paymentType === 'alipay'}
                      onChange={(e) => setPaymentType(e.target.value as 'alipay')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm font-bold">
                        支
                      </div>
                      <span className="text-sm font-medium text-gray-900">支付宝</span>
                    </div>
                    {paymentType === 'alipay' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                  
                  <label 
                    className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                      paymentType === 'wechat' ? 'border-green-500 bg-green-50' : 'border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value="wechat"
                      checked={paymentType === 'wechat'}
                      onChange={(e) => setPaymentType(e.target.value as 'wechat')}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-sm font-bold">
                        微
                      </div>
                      <span className="text-sm font-medium text-gray-900">微信支付</span>
                    </div>
                    {paymentType === 'wechat' && (
                      <div className="absolute top-2 right-2">
                        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  选择您的支付方式，支付完成后自动发放卡密
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>总价:</span>
                  <span className="text-red-600">¥{(product.price * quantity / 100).toFixed(2)}</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-yellow-700 text-sm">
                  ⚠️ 点击支付将跳转到{paymentType === 'alipay' ? '支付宝' : '微信'}支付页面，支付完成后自动发放卡密
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting || product.stock === 0}
                className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${
                  submitting || product.stock === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : paymentType === 'alipay' 
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {submitting 
                  ? '创建订单中...' 
                  : product.stock === 0 
                    ? '商品缺货' 
                    : `立即使用${paymentType === 'alipay' ? '支付宝' : '微信'}支付`
                }
              </button>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  点击支付即表示同意 <Link href="/terms" className="text-orange-600">服务条款</Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
