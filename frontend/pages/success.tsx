import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface CardSecret {
  account: string
  password: string
  additionalInfo?: string
  qualityGuarantee: string
}

export default function SuccessPage() {
  const router = useRouter()
  const { orderId, cardSecret: cardSecretParam } = router.query
  const [cardSecret, setCardSecret] = useState<CardSecret | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState({ account: false, password: false })

  useEffect(() => {
    if (cardSecretParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cardSecretParam as string))
        setCardSecret(parsed)
      } catch (error) {
        console.error('Failed to parse card secret:', error)
      }
    }
  }, [cardSecretParam])

  const copyToClipboard = async (text: string, type: 'account' | 'password') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [type]: true })
      setTimeout(() => {
        setCopied({ ...copied, [type]: false })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const maskPassword = (password: string) => {
    if (!password) return ''
    if (password.length <= 4) return '*'.repeat(password.length)
    return password.substring(0, 2) + '*'.repeat(password.length - 4) + password.substring(password.length - 2)
  }

  if (!cardSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-500">正在加载卡密信息...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>支付成功 - 获取卡密</title>
        <meta name="description" content="支付成功，获取您的卡密信息" />
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">🎉 支付成功！</h1>
          <p className="text-gray-600">您的卡密信息如下，请妥善保存</p>
          <p className="text-sm text-gray-500 mt-2">订单号: {orderId}</p>
        </div>

        {/* Card Secret Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            🔑 卡密信息
            <span className="ml-2 text-sm font-normal text-green-600 bg-green-100 px-2 py-1 rounded">
              已激活
            </span>
          </h2>

          <div className="space-y-4">
            {/* Account */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">账号</label>
                <button
                  onClick={() => copyToClipboard(cardSecret.account, 'account')}
                  className="text-xs text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>{copied.account ? '已复制!' : '复制'}</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-md p-3 font-mono text-sm border-2 border-dashed border-gray-300">
                {cardSecret.account}
              </div>
            </div>

            {/* Password */}
            <div className="border-b pb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">密码</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    {showPassword ? '隐藏' : '显示'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(cardSecret.password, 'password')}
                    className="text-xs text-orange-600 hover:text-orange-700 flex items-center space-x-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{copied.password ? '已复制!' : '复制'}</span>
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-md p-3 font-mono text-sm border-2 border-dashed border-gray-300">
                {showPassword ? cardSecret.password : maskPassword(cardSecret.password)}
              </div>
            </div>

            {/* Quality Guarantee */}
            <div className="bg-blue-50 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">📋 质保说明</h3>
              <p className="text-sm text-blue-700">{cardSecret.qualityGuarantee}</p>
              {cardSecret.additionalInfo && (
                <p className="text-sm text-blue-600 mt-2">{cardSecret.additionalInfo}</p>
              )}
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">⚠️ 重要提醒</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 请立即保存您的账号密码信息</li>
            <li>• 建议截图或复制到安全的地方</li>
            <li>• 如遇问题请在质保期内联系客服</li>
            <li>• 虚拟商品一经售出，非质量问题不退款</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-md text-center hover:bg-orange-700 transition-colors"
          >
            继续购买
          </Link>
          <Link
            href="/orders/query"
            className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-md text-center hover:bg-gray-200 transition-colors"
          >
            查看订单
          </Link>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>如有问题请联系客服，订单号: {orderId}</p>
        </div>
      </div>
    </div>
  )
}
