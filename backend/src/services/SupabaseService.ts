import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Product, CardSecret, Order, EmailStats } from '../types/database'

export class SupabaseService {
  private supabase: SupabaseClient

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Anon Key must be provided in environment variables')
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  // 产品管理
  async getProducts(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get products:', error)
      return []
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to get product by id:', error)
      return null
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .upsert({
          ...product,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to save product:', error)
      throw error
    }
  }

  async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from('products')
        .insert({
          ...productData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add product:', error)
      throw error
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    try {
      // 先检查是否有订单引用该产品
      const { data: orders, error: ordersError } = await this.supabase
        .from('orders')
        .select('id')
        .eq('product_id', productId)
        .limit(1)

      if (ordersError) throw ordersError

      if (orders && orders.length > 0) {
        // 如果有订单引用，改为软删除（标记为 inactive）
        const { error } = await this.supabase
          .from('products')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .eq('id', productId)

        if (error) throw error
        console.log(`Product ${productId} has orders, marked as inactive instead of deleting`)
        return true
      } else {
        // 没有订单引用，可以安全删除
        const { error } = await this.supabase
          .from('products')
          .delete()
          .eq('id', productId)

        if (error) throw error
        return true
      }
    } catch (error) {
      console.error('Failed to delete product:', error)
      return false
    }
  }

  // 卡密管理
  async getCardSecrets(): Promise<CardSecret[]> {
    try {
      const { data, error } = await this.supabase
        .from('card_secrets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get card secrets:', error)
      return []
    }
  }

  async getCardSecretsByProduct(productId: string, status?: string): Promise<CardSecret[]> {
    try {
      let query = this.supabase
        .from('card_secrets')
        .select('*')
        .eq('product_id', productId)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get card secrets by product:', error)
      return []
    }
  }

  async saveCardSecret(cardSecret: CardSecret): Promise<CardSecret> {
    try {
      const { data, error } = await this.supabase
        .from('card_secrets')
        .upsert({
          ...cardSecret,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to save card secret:', error)
      throw error
    }
  }

  async addCardSecret(cardSecretData: Omit<CardSecret, 'id' | 'created_at' | 'updated_at'>): Promise<CardSecret> {
    try {
      const { data, error } = await this.supabase
        .from('card_secrets')
        .insert({
          ...cardSecretData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add card secret:', error)
      throw error
    }
  }

  async deleteCardSecret(cardSecretId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('card_secrets')
        .delete()
        .eq('id', cardSecretId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete card secret:', error)
      return false
    }
  }

  async deleteCardSecretsByProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('card_secrets')
        .delete()
        .eq('product_id', productId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to delete card secrets by product:', error)
      return false
    }
  }

  // 订单管理
  async getOrders(): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get orders:', error)
      return []
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .upsert({
          ...order,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to save order:', error)
      throw error
    }
  }

  async addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .insert({
          ...orderData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to add order:', error)
      throw error
    }
  }

  // 邮箱统计管理
  async getEmailStats(): Promise<EmailStats> {
    try {
      const { data, error } = await this.supabase
        .from('email_stats_view')
        .select('*')

      if (error) throw error

      const emailList = data || []
      
      return {
        totalEmails: emailList.length,
        uniqueEmails: emailList.length,
        emailList: emailList.map((item: any) => ({
          email: item.email,
          orderCount: item.order_count,
          totalAmount: item.total_amount,
          firstOrderDate: item.first_order_date,
          lastOrderDate: item.last_order_date,
          orders: item.orders || []
        }))
      }
    } catch (error) {
      console.error('Failed to get email stats:', error)
      return {
        totalEmails: 0,
        uniqueEmails: 0,
        emailList: []
      }
    }
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('contact_info', email)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Failed to get orders by email:', error)
      return []
    }
  }

  // 库存管理
  async updateProductStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('products')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update product stock:', error)
      return false
    }
  }

  async incrementProductSoldCount(productId: string): Promise<boolean> {
    try {
      // 先获取当前销量
      const { data: product, error: fetchError } = await this.supabase
        .from('products')
        .select('sold_count')
        .eq('id', productId)
        .single()

      if (fetchError) throw fetchError

      // 更新销量
      const { error } = await this.supabase
        .from('products')
        .update({ 
          sold_count: (product?.sold_count || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to increment product sold count:', error)
      return false
    }
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('products')
        .select('id')
        .limit(1)

      return !error
    } catch (error) {
      console.error('Supabase health check failed:', error)
      return false
    }
  }
}
