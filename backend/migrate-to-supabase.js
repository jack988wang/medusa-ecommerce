// 数据迁移脚本：从文件系统迁移到 Supabase
require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

async function migrateToSupabase() {
  console.log('🚀 Starting data migration from file system to Supabase...')
  
  // 初始化 Supabase 客户端
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)')
    return false
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // 1. 读取文件系统数据
    console.log('📁 Reading file system data...')
    const dataDir = path.join(process.cwd(), 'data')
    const productsFile = path.join(dataDir, 'products.json')
    const cardSecretsFile = path.join(dataDir, 'card-secrets.json')
    const ordersFile = path.join(dataDir, 'orders.json')
    
    let products = []
    let cardSecrets = []
    let orders = []
    
    if (fs.existsSync(productsFile)) {
      products = JSON.parse(fs.readFileSync(productsFile, 'utf8'))
      console.log(`📦 Found ${products.length} products`)
    } else {
      console.log('⚠️  No products.json found, skipping products migration')
    }
    
    if (fs.existsSync(cardSecretsFile)) {
      cardSecrets = JSON.parse(fs.readFileSync(cardSecretsFile, 'utf8'))
      console.log(`🔑 Found ${cardSecrets.length} card secrets`)
    } else {
      console.log('⚠️  No card-secrets.json found, skipping card secrets migration')
    }
    
    if (fs.existsSync(ordersFile)) {
      orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8'))
      console.log(`📋 Found ${orders.length} orders`)
    } else {
      console.log('⚠️  No orders.json found, skipping orders migration')
    }
    
    // 2. 迁移产品数据
    if (products.length > 0) {
      console.log('🔄 Migrating products...')
      for (const product of products) {
        try {
          const { error } = await supabase
            .from('products')
            .upsert({
              id: product.id,
              title: product.title,
              description: product.description,
              category: product.category,
              subcategory: product.subcategory,
              price: product.price,
              currency: product.currency,
              stock: product.stock,
              sold_count: product.sold_count,
              quality_guarantee: product.quality_guarantee,
              attributes: product.attributes,
              status: product.status,
              created_at: product.created_at,
              updated_at: product.updated_at
            })
          
          if (error) {
            console.error(`❌ Failed to migrate product ${product.id}:`, error.message)
          } else {
            console.log(`✅ Migrated product: ${product.title}`)
          }
        } catch (err) {
          console.error(`❌ Error migrating product ${product.id}:`, err.message)
        }
      }
    }
    
    // 3. 迁移卡密数据
    if (cardSecrets.length > 0) {
      console.log('🔄 Migrating card secrets...')
      for (const cardSecret of cardSecrets) {
        try {
          const { error } = await supabase
            .from('card_secrets')
            .upsert({
              id: cardSecret.id,
              product_id: cardSecret.product_id,
              account: cardSecret.account,
              password: cardSecret.password,
              additional_info: cardSecret.additional_info,
              quality_guarantee: cardSecret.quality_guarantee,
              status: cardSecret.status,
              sold_at: cardSecret.sold_at,
              order_id: cardSecret.order_id,
              created_at: cardSecret.created_at,
              updated_at: cardSecret.updated_at
            })
          
          if (error) {
            console.error(`❌ Failed to migrate card secret ${cardSecret.id}:`, error.message)
          } else {
            console.log(`✅ Migrated card secret: ${cardSecret.account}`)
          }
        } catch (err) {
          console.error(`❌ Error migrating card secret ${cardSecret.id}:`, err.message)
        }
      }
    }
    
    // 4. 迁移订单数据
    if (orders.length > 0) {
      console.log('🔄 Migrating orders...')
      for (const order of orders) {
        try {
          const { error } = await supabase
            .from('orders')
            .upsert({
              id: order.id,
              order_number: order.order_number,
              product_id: order.product_id,
              product_title: order.product_title,
              quantity: order.quantity,
              unit_price: order.unit_price,
              total_amount: order.total_amount,
              currency: order.currency,
              contact_info: order.contact_info,
              payment_method: order.payment_method,
              payment_status: order.payment_status,
              payment_transaction_id: order.payment_transaction_id,
              card_secret_delivered_at: order.card_secret_delivered_at,
              expires_at: order.expires_at,
              card_secret: order.card_secret,
              created_at: order.created_at,
              updated_at: order.updated_at
            })
          
          if (error) {
            console.error(`❌ Failed to migrate order ${order.id}:`, error.message)
          } else {
            console.log(`✅ Migrated order: ${order.order_number}`)
          }
        } catch (err) {
          console.error(`❌ Error migrating order ${order.id}:`, err.message)
        }
      }
    }
    
    // 5. 验证迁移结果
    console.log('🔍 Verifying migration results...')
    
    const { data: migratedProducts, error: productsError } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    const { data: migratedCardSecrets, error: cardSecretsError } = await supabase
      .from('card_secrets')
      .select('count')
      .limit(1)
    
    const { data: migratedOrders, error: ordersError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
    
    console.log('\n📊 Migration Summary:')
    console.log(`Products: ${products.length} → Supabase (${productsError ? 'Error' : 'Success'})`)
    console.log(`Card Secrets: ${cardSecrets.length} → Supabase (${cardSecretsError ? 'Error' : 'Success'})`)
    console.log(`Orders: ${orders.length} → Supabase (${ordersError ? 'Error' : 'Success'})`)
    
    if (!productsError && !cardSecretsError && !ordersError) {
      console.log('\n🎉 Data migration completed successfully!')
      console.log('✅ All data has been migrated to Supabase')
      console.log('🔄 You can now update your environment variables to use Supabase')
      return true
    } else {
      console.log('\n⚠️  Migration completed with some errors')
      console.log('Please check the error messages above and retry if necessary')
      return false
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message)
    return false
  }
}

// 运行迁移
migrateToSupabase()
  .then(success => {
    if (success) {
      console.log('\n✅ Migration completed successfully!')
      console.log('📝 Next steps:')
      console.log('1. Update your environment variables with Supabase credentials')
      console.log('2. Deploy the updated backend to Render')
      console.log('3. Test the application functionality')
    } else {
      console.log('\n❌ Migration failed. Please check the errors above.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Migration script error:', error)
    process.exit(1)
  })
