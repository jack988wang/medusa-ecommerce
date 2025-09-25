import { useState, useEffect } from 'react'
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

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: Category[]
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('sales')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
    fetchProducts()
  }, [selectedCategory, selectedSubcategory, sortBy])

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/categories`)
      const data = await response.json()
      if (data.success) {
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedSubcategory && { subcategory: selectedSubcategory })
      })
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/products?${params}`)
      const data = await response.json()
      if (data.success) {
        // 只显示 active 状态的产品，过滤掉 inactive 的
        const activeProducts = data.products.filter((product: Product) => product.status === 'active')
        setProducts(activeProducts)
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
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

  const handleBuyNow = (product: Product) => {
    // 跳转到购买页面
    window.location.href = `/purchase/${product.id}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>卡密自动售货网站 - 虚拟商品专业平台</title>
        <meta name="description" content="专业的虚拟商品自动售货平台，提供谷歌邮箱、微软邮箱等各类虚拟账号" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-orange-600">🔑 卡密商城</h1>
              <span className="text-sm text-gray-500 hidden sm:inline">专业虚拟商品平台</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/orders/query" className="text-sm text-gray-600 hover:text-orange-600">
                订单查询
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Categories */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-gray-900 mb-4">商品分类</h3>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setSelectedCategory('')
                    setSelectedSubcategory('')
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    !selectedCategory ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                  }`}
                >
                  全部商品
                </button>
                
                {categories.map((category) => (
                  <div key={category.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(category.id)
                        setSelectedSubcategory('')
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category.id ? 'bg-orange-100 text-orange-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      {category.name}
                    </button>
                    
                    {selectedCategory === category.id && category.subcategories && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategory(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-md text-xs transition-colors ${
                              selectedSubcategory === sub.id ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50'
                            }`}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort Controls */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  共找到 {products.length} 个商品
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">排序:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    <option value="sales">销量排序</option>
                    <option value="price_asc">价格从低到高</option>
                    <option value="price_desc">价格从高到低</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-500">暂无商品</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm">
                        {product.title}
                      </h3>
                      
                      <div className="flex flex-wrap gap-1 mb-3">
                        {product.attributes.slice(0, 3).map((attr, index) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {attr}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div className="text-2xl font-bold text-red-600">
                          ¥{product.price / 100}
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <div>库存: <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>{product.stock}</span></div>
                          <div>销量: {product.sold_count}</div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500 mb-3">
                        {product.quality_guarantee}
                      </div>

                      <button
                        onClick={() => handleBuyNow(product)}
                        disabled={product.stock === 0}
                        className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                          product.stock === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                        }`}
                      >
                        {product.stock === 0 ? '已售罄' : '立即购买'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-6xl mx-auto py-6 px-4">
          <div className="text-center text-gray-500 text-sm space-y-2">
            <p>&copy; 2024 卡密商城. 专业虚拟商品平台</p>
            <p className="text-xs">虚拟商品一经售出，非质量问题不退款</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

