import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  category: string
  subcategory: string
  price: number
  currency: string
  stock: number
  sold_count: number
  quality_guarantee: string
  attributes: string[]
  status: string
}

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newProduct, setNewProduct] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    quality_guarantee: '',
    attributes: ''
  })

  useEffect(() => {
    // 检查管理员认证
    const authStatus = sessionStorage.getItem('admin_authenticated')
    if (authStatus !== 'true') {
      router.push('/admin')
      return
    }
    
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.products)
      } else {
        setError('获取产品列表失败')
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newProduct.title || !newProduct.price || !newProduct.category) {
      setError('请填写必要信息')
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newProduct.title,
          description: newProduct.description,
          category: newProduct.category,
          subcategory: newProduct.subcategory,
          price: parseInt(newProduct.price) * 100, // 转换为分
          quality_guarantee: newProduct.quality_guarantee,
          attributes: newProduct.attributes.split(',').map(attr => attr.trim()).filter(Boolean)
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert('产品添加成功！')
        setShowAddForm(false)
        setNewProduct({
          title: '',
          description: '',
          category: '',
          subcategory: '',
          price: '',
          quality_guarantee: '',
          attributes: ''
        })
        fetchProducts()
      } else {
        setError(result.error || '添加产品失败')
      }
    } catch (error) {
      console.error('Failed to add product:', error)
      setError('网络错误，请重试')
    }
  }

  const handleDeleteProduct = async (productId: string, productTitle: string) => {
    if (!confirm(`确定要删除产品 "${productTitle}" 吗？\n注意：如果该产品下有卡密，需要先删除所有卡密。`)) {
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products/${productId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        alert('产品删除成功！')
        fetchProducts() // 刷新产品列表
      } else {
        alert(result.error || '删除产品失败')
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      alert('删除产品失败')
    }
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
        <title>产品管理 - 管理后台</title>
        <meta name="description" content="产品管理" />
      </Head>

      <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="text-orange-600 hover:text-orange-700 text-sm mb-4 inline-flex items-center">
              ← 返回管理后台
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">产品管理</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            添加产品
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">添加新产品</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">产品名称 *</label>
                    <input
                      type="text"
                      value={newProduct.title}
                      onChange={(e) => setNewProduct({...newProduct, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例如：Google邮箱账号"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">价格 (元) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例如：15.00"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">产品描述</label>
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    rows={3}
                    placeholder="详细描述产品特点和功能"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">主分类 *</label>
                    <input
                      type="text"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例如：邮箱账号"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">子分类</label>
                    <input
                      type="text"
                      value={newProduct.subcategory}
                      onChange={(e) => setNewProduct({...newProduct, subcategory: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="例如：Google"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">质保说明</label>
                  <input
                    type="text"
                    value={newProduct.quality_guarantee}
                    onChange={(e) => setNewProduct({...newProduct, quality_guarantee: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="例如：质保首登，非人为问题7天包换"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">产品标签</label>
                  <input
                    type="text"
                    value={newProduct.attributes}
                    onChange={(e) => setNewProduct({...newProduct, attributes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    placeholder="用逗号分隔，例如：Gmail,Google Drive,YouTube"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-600 text-white py-3 px-6 rounded-md hover:bg-orange-700"
                  >
                    添加产品
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-md hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Products List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">产品列表</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">产品信息</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分类</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">价格</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">库存/销量</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.description}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {product.attributes.map((attr, index) => (
                            <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{product.category}</div>
                      {product.subcategory && (
                        <div className="text-sm text-gray-500">{product.subcategory}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatPrice(product.price, product.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">库存: {product.stock}</div>
                      <div className="text-sm text-gray-500">销量: {product.sold_count}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.status === 'active' ? '上架' : '下架'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/card-secrets?productId=${product.id}`}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          管理卡密
                        </Link>
                        <button className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">
                          编辑
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-4">暂无产品</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-orange-600 text-white px-6 py-3 rounded-md hover:bg-orange-700"
            >
              添加第一个产品
            </button>
          </div>
        )}
      </div>
    </div>
  )
}