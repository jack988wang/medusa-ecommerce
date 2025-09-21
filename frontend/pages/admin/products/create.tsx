import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  slug: string
  subcategories?: Category[]
}

export default function CreateProductPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    price: '',
    currency: 'CNY',
    quality_guarantee: '',
    requires_card_secret: true,
    sort_weight: '0',
    attributes: [''],
    status: 'draft' as 'draft' | 'active'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCategories()
  }, [])

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAttributeChange = (index: number, value: string) => {
    const newAttributes = [...formData.attributes]
    newAttributes[index] = value
    setFormData(prev => ({
      ...prev,
      attributes: newAttributes
    }))
  }

  const addAttribute = () => {
    if (formData.attributes.length < 10) {
      setFormData(prev => ({
        ...prev,
        attributes: [...prev.attributes, '']
      }))
    }
  }

  const removeAttribute = (index: number) => {
    if (formData.attributes.length > 1) {
      const newAttributes = formData.attributes.filter((_, i) => i !== index)
      setFormData(prev => ({
        ...prev,
        attributes: newAttributes
      }))
    }
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('商品名称不能为空')
      return false
    }
    if (!formData.category) {
      setError('请选择商品分类')
      return false
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('商品价格必须大于0')
      return false
    }
    return true
  }

  const handleSubmit = async (submitStatus: 'draft' | 'active') => {
    setError('')
    
    if (!validateForm()) return

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        sort_weight: parseInt(formData.sort_weight) || 0,
        attributes: formData.attributes.filter(attr => attr.trim()),
        status: submitStatus
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/api/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      if (result.success) {
        const actionText = submitStatus === 'draft' ? '保存草稿' : '创建并上架'
        alert(`${actionText}成功！`)
        router.push('/admin/products')
      } else {
        setError(result.error || '创建失败')
      }
    } catch (error) {
      console.error('Create product failed:', error)
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const selectedCategory = categories.find(cat => cat.id === formData.category)

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>新建商品 - 卡密商城后台</title>
        <meta name="description" content="新建商品" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-4">
            <Link href="/admin/products" className="text-orange-600 hover:text-orange-700">
              ← 返回商品管理
            </Link>
            <h1 className="text-xl font-bold text-gray-900">新建商品</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <p className="text-sm text-gray-600">
              带 <span className="text-red-500">*</span> 为必填项
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form className="space-y-6">
            {/* 基本信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">基本信息</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="如：【长效秘钥2fa】全新谷歌Gmail邮箱"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    最多50字，不能与现有商品重复
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      所属分类 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        handleInputChange('category', e.target.value)
                        handleInputChange('subcategory', '') // 重置子分类
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">请选择分类</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      子分类
                    </label>
                    <select
                      value={formData.subcategory}
                      onChange={(e) => handleInputChange('subcategory', e.target.value)}
                      disabled={!selectedCategory?.subcategories}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100"
                    >
                      <option value="">请选择子分类</option>
                      {selectedCategory?.subcategories?.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="详细描述商品特性、使用说明等"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 价格信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">价格信息</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单价 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">¥</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0.01"
                      min="0.01"
                      step="0.01"
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    最小0.01元，保留2位小数
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    货币类型
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="CNY">人民币 (¥)</option>
                    <option value="USD">美元 ($)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 库存与卡密 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">库存与卡密</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  卡密关联方式 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.requires_card_secret === true}
                      onChange={() => handleInputChange('requires_card_secret', true)}
                      className="mr-2"
                    />
                    需关联卡密（自动发放）
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.requires_card_secret === false}
                      onChange={() => handleInputChange('requires_card_secret', false)}
                      className="mr-2"
                    />
                    无需卡密（虚拟商品）
                  </label>
                </div>
                {formData.requires_card_secret && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-700 text-sm">
                      💡 商品创建后需在「卡密管理」上传卡密，否则用户购买后无法发货
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 其他信息 */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">其他信息</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    质保说明
                  </label>
                  <input
                    type="text"
                    value={formData.quality_guarantee}
                    onChange={(e) => handleInputChange('quality_guarantee', e.target.value)}
                    placeholder="如：质保首登、质保12小时内首登"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    商品属性标签
                  </label>
                  <div className="space-y-2">
                    {formData.attributes.map((attribute, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={attribute}
                          onChange={(e) => handleAttributeChange(index, e.target.value)}
                          placeholder={`属性标签 ${index + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        {formData.attributes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAttribute(index)}
                            className="text-red-600 hover:text-red-700 px-2 py-2"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.attributes.length < 10 && (
                      <button
                        type="button"
                        onClick={addAttribute}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        + 添加属性标签
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    如：2024年注册、质保首登、支持2FA等
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    排序权重
                  </label>
                  <input
                    type="number"
                    value={formData.sort_weight}
                    onChange={(e) => handleInputChange('sort_weight', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    数字越大越靠前，默认为0
                  </p>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="border-t pt-6">
              <div className="flex justify-end space-x-4">
                <Link
                  href="/admin/products"
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  取消
                </Link>
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? '保存中...' : '保存草稿'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('active')}
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? '提交中...' : '提交上架'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* 帮助说明 */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">📝 填写说明</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>保存草稿</strong>：商品仅在后台可见，可以稍后编辑和上传卡密</p>
            <p>• <strong>提交上架</strong>：商品立即在前端展示并可销售</p>
            <p>• 需关联卡密的商品，创建后请及时上传卡密以免影响销售</p>
            <p>• 商品属性标签将在前端商品卡片中显示，建议不超过5个</p>
          </div>
        </div>
      </div>
    </div>
  )
}
