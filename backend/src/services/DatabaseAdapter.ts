import { DatabaseService } from './DatabaseService'
import { SupabaseService } from './SupabaseService'
import { Product, CardSecret, Order, EmailStats, convertToSupabaseProduct, convertToSupabaseCardSecret, convertToSupabaseOrder, convertToFileSystemProduct, convertToFileSystemCardSecret, convertToFileSystemOrder } from '../types/database'

export interface DatabaseAdapter {
  getProducts(): Promise<Product[]>
  getProductById(id: string): Promise<Product | null>
  saveProduct(product: Product): Promise<Product>
  addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product>
  deleteProduct(productId: string): Promise<boolean>
  getCardSecrets(): Promise<CardSecret[]>
  getCardSecretsByProduct(productId: string, status?: string): Promise<CardSecret[]>
  saveCardSecret(cardSecret: CardSecret): Promise<CardSecret>
  addCardSecret(cardSecretData: Omit<CardSecret, 'id' | 'created_at' | 'updated_at'>): Promise<CardSecret>
  deleteCardSecret(cardSecretId: string): Promise<boolean>
  getOrders(): Promise<Order[]>
  saveOrder(order: Order): Promise<Order>
  addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order>
  getEmailStats(): Promise<EmailStats>
  getOrdersByEmail(email: string): Promise<Order[]>
  updateProductStock(productId: string, newStock: number): Promise<boolean>
  incrementProductSoldCount(productId: string): Promise<boolean>
}

export class DatabaseAdapterService implements DatabaseAdapter {
  private databaseService: DatabaseService
  private supabaseService: SupabaseService
  private useSupabase: boolean

  constructor() {
    this.databaseService = new DatabaseService()
    this.useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
    
    if (this.useSupabase) {
      try {
        this.supabaseService = new SupabaseService()
        console.log('✅ Using Supabase database service')
      } catch (error) {
        console.error('❌ Failed to initialize Supabase service, falling back to file system:', error)
        this.useSupabase = false
      }
    } else {
      console.log('📁 Using file system database service')
    }
  }

  private getService() {
    return this.useSupabase ? this.supabaseService : this.databaseService
  }

  async getProducts(): Promise<Product[]> {
    if (this.useSupabase) {
      const products = await this.supabaseService.getProducts()
      return products.map(convertToFileSystemProduct)
    } else {
      return await this.databaseService.getProducts()
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    if (this.useSupabase) {
      const product = await this.supabaseService.getProductById(id)
      return product ? convertToFileSystemProduct(product) : null
    } else {
      return await this.databaseService.getProductById(id)
    }
  }

  async saveProduct(product: Product): Promise<Product> {
    if (this.useSupabase) {
      const convertedProduct = convertToSupabaseProduct(product)
      const savedProduct = await this.supabaseService.saveProduct(convertedProduct)
      return convertToFileSystemProduct(savedProduct)
    } else {
      return await this.databaseService.saveProduct(product)
    }
  }

  async addProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    if (this.useSupabase) {
      const newProduct = await this.supabaseService.addProduct(productData)
      return convertToFileSystemProduct(newProduct)
    } else {
      return await this.databaseService.addProduct(productData)
    }
  }

  async deleteProduct(productId: string): Promise<boolean> {
    return this.getService().deleteProduct(productId)
  }

  async getCardSecrets(): Promise<CardSecret[]> {
    if (this.useSupabase) {
      const cardSecrets = await this.supabaseService.getCardSecrets()
      return cardSecrets.map(convertToFileSystemCardSecret)
    } else {
      return await this.databaseService.getCardSecrets()
    }
  }

  async getCardSecretsByProduct(productId: string, status?: string): Promise<CardSecret[]> {
    if (this.useSupabase) {
      const cardSecrets = await this.supabaseService.getCardSecretsByProduct(productId, status)
      return cardSecrets.map(convertToFileSystemCardSecret)
    } else {
      return await this.databaseService.getCardSecretsByProduct(productId, status)
    }
  }

  async saveCardSecret(cardSecret: CardSecret): Promise<CardSecret> {
    if (this.useSupabase) {
      const convertedCardSecret = convertToSupabaseCardSecret(cardSecret)
      const savedCardSecret = await this.supabaseService.saveCardSecret(convertedCardSecret)
      return convertToFileSystemCardSecret(savedCardSecret)
    } else {
      return await this.databaseService.saveCardSecret(cardSecret)
    }
  }

  async addCardSecret(cardSecretData: Omit<CardSecret, 'id' | 'created_at' | 'updated_at'>): Promise<CardSecret> {
    if (this.useSupabase) {
      const newCardSecret = await this.supabaseService.addCardSecret(cardSecretData)
      return convertToFileSystemCardSecret(newCardSecret)
    } else {
      return await this.databaseService.addCardSecret(cardSecretData)
    }
  }

  async deleteCardSecret(cardSecretId: string): Promise<boolean> {
    if (this.useSupabase) {
      // Supabase 实现暂未提供，先回退到文件系统实现以保持一致行为
      return await this.databaseService.deleteCardSecret(cardSecretId)
    } else {
      return await this.databaseService.deleteCardSecret(cardSecretId)
    }
  }

  async getOrders(): Promise<Order[]> {
    if (this.useSupabase) {
      const orders = await this.supabaseService.getOrders()
      return orders.map(convertToFileSystemOrder)
    } else {
      return await this.databaseService.getOrders()
    }
  }

  async saveOrder(order: Order): Promise<Order> {
    if (this.useSupabase) {
      const convertedOrder = convertToSupabaseOrder(order)
      const savedOrder = await this.supabaseService.saveOrder(convertedOrder)
      return convertToFileSystemOrder(savedOrder)
    } else {
      return await this.databaseService.saveOrder(order)
    }
  }

  async addOrder(orderData: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order> {
    if (this.useSupabase) {
      const newOrder = await this.supabaseService.addOrder(orderData)
      return convertToFileSystemOrder(newOrder)
    } else {
      return await this.databaseService.addOrder(orderData)
    }
  }

  async getEmailStats(): Promise<EmailStats> {
    if (this.useSupabase) {
      return await this.supabaseService.getEmailStats()
    } else {
      return await this.databaseService.getEmailStats()
    }
  }

  async getOrdersByEmail(email: string): Promise<Order[]> {
    if (this.useSupabase) {
      const orders = await this.supabaseService.getOrdersByEmail(email)
      return orders.map(convertToFileSystemOrder)
    } else {
      return await this.databaseService.getOrdersByEmail(email)
    }
  }

  async updateProductStock(productId: string, newStock: number): Promise<boolean> {
    if (this.useSupabase && this.supabaseService.updateProductStock) {
      return this.supabaseService.updateProductStock(productId, newStock)
    }
    // 文件系统模式下，通过更新产品数据来实现
    const product = await this.getProductById(productId)
    if (product) {
      product.stock = newStock
      await this.saveProduct(product)
      return true
    }
    return false
  }

  async incrementProductSoldCount(productId: string): Promise<boolean> {
    if (this.useSupabase && this.supabaseService.incrementProductSoldCount) {
      return this.supabaseService.incrementProductSoldCount(productId)
    }
    // 文件系统模式下，通过更新产品数据来实现
    const product = await this.getProductById(productId)
    if (product) {
      product.sold_count += 1
      await this.saveProduct(product)
      return true
    }
    return false
  }

  // 健康检查
  async healthCheck(): Promise<boolean> {
    try {
      if (this.useSupabase && this.supabaseService.healthCheck) {
        return await this.supabaseService.healthCheck()
      }
      // 文件系统模式下，尝试读取产品数据
      await this.getProducts()
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }

  // 获取当前使用的数据库类型
  getDatabaseType(): string {
    return this.useSupabase ? 'Supabase' : 'File System'
  }
}
