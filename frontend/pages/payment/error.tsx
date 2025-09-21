import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function PaymentErrorPage() {
  const router = useRouter()
  const { message } = router.query

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>支付异常 - 卡密商城</title>
        <meta name="description" content="支付过程中发生异常" />
      </Head>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">支付异常</h1>
          <p className="text-gray-600 mb-6">
            {message ? decodeURIComponent(message as string) : '支付过程中发生了异常'}
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">可能的原因：</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 支付过程中网络连接中断</li>
              <li>• 订单参数异常或已过期</li>
              <li>• 支付平台系统繁忙</li>
              <li>• 浏览器兼容性问题</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.back()}
                className="bg-orange-600 text-white py-3 px-6 rounded-md hover:bg-orange-700 transition-colors"
              >
                返回重试
              </button>
              
              <Link
                href="/orders/query"
                className="bg-gray-100 text-gray-700 py-3 px-6 rounded-md text-center hover:bg-gray-200 transition-colors"
              >
                查询订单
              </Link>
            </div>

            <Link
              href="/"
              className="inline-block text-orange-600 hover:text-orange-700 text-sm"
            >
              ← 返回商城首页
            </Link>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">📞 需要帮助？</h3>
            <p className="text-sm text-blue-700">
              如果问题持续存在，请联系客服获取帮助。<br />
              请准备好您的订单信息以便快速处理。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
