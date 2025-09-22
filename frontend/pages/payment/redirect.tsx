import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PaymentRedirect() {
  const router = useRouter()
  const { url } = router.query

  useEffect(() => {
    if (typeof url === 'string' && /^https?:\/\//i.test(url)) {
      try {
        // 使用 replace 不留历史记录，更不易被拦截
        window.location.replace(url)
      } catch (e) {
        // 忽略，下面提供按钮和 iframe 兜底
      }
    }
  }, [url])

  if (!url || typeof url !== 'string') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <h1 className="text-xl font-bold mb-2">缺少支付地址</h1>
          <p className="text-gray-600">请返回重新下单。</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold mb-3">正在跳转到支付页面…</h1>
        <p className="text-gray-600 mb-4">如未自动跳转，可点击下方按钮前往支付。</p>
        <a
          href={typeof url === 'string' ? url : '#'}
          target="_self"
          className="inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          立即前往支付
        </a>
        <div className="mt-6">
          <iframe
            src={typeof url === 'string' ? url : undefined}
            className="w-full h-[70vh] border rounded"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  )
}
