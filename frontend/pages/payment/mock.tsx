import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function MockPaymentPage() {
  const router = useRouter()
  const { payId, type, price, param } = router.query
  const [orderData, setOrderData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (param) {
      try {
        const parsed = JSON.parse(decodeURIComponent(param as string))
        setOrderData(parsed)
      } catch (error) {
        console.error('Failed to parse order data:', error)
      }
    }
  }, [param])

  const handleMockPayment = async (success: boolean) => {
    setLoading(true)
    
    if (success) {
      try {
        // 模拟支付成功，调用后端回调
        const callbackUrl = 'http://localhost:9000/api/payment/notify'
        const callbackData = new URLSearchParams({
          payId: payId as string,
          param: param as string,
          type: type as string,
          price: price as string,
          reallyPrice: price as string,
          sign: 'mock_signature' // 在开发模式下使用模拟签名
        })

        // 这里模拟第三方平台的异步回调
        const response = await fetch(callbackUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: callbackData
        })

        // 跳转到同步回调（用户看到的成功页面）
        const returnUrl = `http://localhost:9000/api/payment/return?${callbackData}`
        window.location.href = returnUrl
      } catch (error) {
        console.error('Mock payment failed:', error)
        alert('模拟支付失败，请重试')
      }
    } else {
      // 模拟支付失败
      router.push('/payment/error?message=' + encodeURIComponent('用户取消支付'))
    }
    
    setLoading(false)
  }

  if (!payId || !orderData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>模拟支付 - 开发测试</title>
      </Head>

      <div className="max-w-md mx-auto pt-16 px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* 支付方式图标 */}
          <div className="text-center mb-6">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center text-white text-xl font-bold ${
              type === '1' ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {type === '1' ? '微' : '支'}
            </div>
            <h2 className="text-lg font-bold text-gray-900 mt-2">
              {type === '1' ? '微信支付' : '支付宝支付'}
            </h2>
            <p className="text-sm text-gray-500">开发测试模式</p>
          </div>

          {/* 订单信息 */}
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">商品</span>
              <span className="text-gray-900">{orderData.productId}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">订单号</span>
              <span className="text-gray-900 font-mono text-xs">{payId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">支付金额</span>
              <span className="text-2xl font-bold text-red-600">¥{price}</span>
            </div>
          </div>

          {/* 开发提示 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🔧 开发测试模式</h3>
            <p className="text-sm text-yellow-700">
              这是一个模拟支付页面，用于开发测试。在生产环境中，用户将跳转到真实的第三方支付平台。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <button
              onClick={() => handleMockPayment(true)}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-colors ${
                loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : type === '1' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? '处理中...' : '✅ 模拟支付成功'}
            </button>

            <button
              onClick={() => handleMockPayment(false)}
              disabled={loading}
              className="w-full py-3 px-4 border-2 border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              ❌ 模拟支付失败
            </button>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← 返回商城
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
