// 统一的数据库类型定义
export interface DatabaseRecord {
  id: string
  created_at: string | Date
  updated_at: string | Date
}

export interface Product extends DatabaseRecord {
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

export interface CardSecret extends DatabaseRecord {
  product_id: string
  account: string
  password: string
  additional_info?: string
  quality_guarantee: string
  status: string
  sold_at?: string | Date
  order_id?: string
}

export interface Order extends DatabaseRecord {
  order_number: string
  product_id: string
  product_title: string
  quantity: number
  unit_price: number
  total_amount: number
  currency: string
  contact_info: string
  payment_method?: string
  payment_status: string
  payment_transaction_id?: string
  card_secret_delivered_at?: string | Date
  expires_at?: string | Date
  card_secret?: {
    account: string
    password: string
    additionalInfo?: string
    qualityGuarantee: string
  }
}

export interface EmailStats {
  totalEmails: number
  uniqueEmails: number
  emailList: Array<{
    email: string
    orderCount: number
    totalAmount: number
    firstOrderDate: string | Date
    lastOrderDate: string | Date
    orders: Order[]
  }>
}

// 类型转换工具函数
export function convertToSupabaseProduct(product: Product): Product {
  return {
    ...product,
    created_at: typeof product.created_at === 'string' ? product.created_at : product.created_at.toISOString(),
    updated_at: typeof product.updated_at === 'string' ? product.updated_at : product.updated_at.toISOString()
  }
}

export function convertToSupabaseCardSecret(cardSecret: CardSecret): CardSecret {
  return {
    ...cardSecret,
    created_at: typeof cardSecret.created_at === 'string' ? cardSecret.created_at : cardSecret.created_at.toISOString(),
    updated_at: typeof cardSecret.updated_at === 'string' ? cardSecret.updated_at : cardSecret.updated_at.toISOString(),
    sold_at: cardSecret.sold_at ? (typeof cardSecret.sold_at === 'string' ? cardSecret.sold_at : cardSecret.sold_at.toISOString()) : undefined
  }
}

export function convertToSupabaseOrder(order: Order): Order {
  return {
    ...order,
    created_at: typeof order.created_at === 'string' ? order.created_at : order.created_at.toISOString(),
    updated_at: typeof order.updated_at === 'string' ? order.updated_at : order.updated_at.toISOString(),
    card_secret_delivered_at: order.card_secret_delivered_at ? (typeof order.card_secret_delivered_at === 'string' ? order.card_secret_delivered_at : order.card_secret_delivered_at.toISOString()) : undefined,
    expires_at: order.expires_at ? (typeof order.expires_at === 'string' ? order.expires_at : order.expires_at.toISOString()) : undefined
  }
}

export function convertToFileSystemProduct(product: Product): Product {
  return {
    ...product,
    created_at: typeof product.created_at === 'string' ? new Date(product.created_at) : product.created_at,
    updated_at: typeof product.updated_at === 'string' ? new Date(product.updated_at) : product.updated_at
  }
}

export function convertToFileSystemCardSecret(cardSecret: CardSecret): CardSecret {
  return {
    ...cardSecret,
    created_at: typeof cardSecret.created_at === 'string' ? new Date(cardSecret.created_at) : cardSecret.created_at,
    updated_at: typeof cardSecret.updated_at === 'string' ? new Date(cardSecret.updated_at) : cardSecret.updated_at,
    sold_at: cardSecret.sold_at ? (typeof cardSecret.sold_at === 'string' ? new Date(cardSecret.sold_at) : cardSecret.sold_at) : undefined
  }
}

export function convertToFileSystemOrder(order: Order): Order {
  return {
    ...order,
    created_at: typeof order.created_at === 'string' ? new Date(order.created_at) : order.created_at,
    updated_at: typeof order.updated_at === 'string' ? new Date(order.updated_at) : order.updated_at,
    card_secret_delivered_at: order.card_secret_delivered_at ? (typeof order.card_secret_delivered_at === 'string' ? new Date(order.card_secret_delivered_at) : order.card_secret_delivered_at) : undefined,
    expires_at: order.expires_at ? (typeof order.expires_at === 'string' ? new Date(order.expires_at) : order.expires_at) : undefined
  }
}
