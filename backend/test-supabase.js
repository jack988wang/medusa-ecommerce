// Supabase 连接测试脚本
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...')
  
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Required: SUPABASE_URL, SUPABASE_ANON_KEY')
    return false
  }
  
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // 测试连接
    console.log('🔗 Testing database connection...')
    const { data, error } = await supabase
      .from('products')
      .select('id, title')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }
    
    console.log('✅ Database connection successful!')
    console.log('📊 Sample data:', data)
    
    // 测试表是否存在
    console.log('🔍 Checking table structure...')
    const tables = ['products', 'card_secrets', 'orders']
    
    for (const table of tables) {
      try {
        const { data: tableData, error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1)
        
        if (tableError) {
          console.log(`⚠️  Table '${table}' may not exist or have permission issues`)
        } else {
          console.log(`✅ Table '${table}' is accessible`)
        }
      } catch (err) {
        console.log(`❌ Error checking table '${table}':`, err.message)
      }
    }
    
    // 测试邮箱统计视图
    console.log('📈 Testing email stats view...')
    try {
      const { data: statsData, error: statsError } = await supabase
        .from('email_stats_view')
        .select('*')
        .limit(1)
      
      if (statsError) {
        console.log('⚠️  Email stats view may not exist:', statsError.message)
      } else {
        console.log('✅ Email stats view is accessible')
      }
    } catch (err) {
      console.log('❌ Error checking email stats view:', err.message)
    }
    
    console.log('🎉 Supabase connection test completed successfully!')
    return true
    
  } catch (error) {
    console.error('❌ Supabase connection test failed:', error.message)
    return false
  }
}

// 运行测试
testSupabaseConnection()
  .then(success => {
    if (success) {
      console.log('\n✅ All tests passed! Ready to use Supabase.')
    } else {
      console.log('\n❌ Tests failed. Please check your configuration.')
    }
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('💥 Test script error:', error)
    process.exit(1)
  })
