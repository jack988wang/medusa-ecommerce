-- Supabase 数据库表结构
-- 适用于卡密商城系统

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. 产品表 (products)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    price INTEGER NOT NULL, -- 以分为单位存储
    currency VARCHAR(10) DEFAULT 'CNY',
    stock INTEGER DEFAULT 0,
    sold_count INTEGER DEFAULT 0,
    quality_guarantee TEXT,
    attributes TEXT[], -- 产品属性数组
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 卡密表 (card_secrets)
CREATE TABLE IF NOT EXISTS card_secrets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    account VARCHAR(255) NOT NULL,
    password TEXT NOT NULL, -- 加密存储
    additional_info TEXT,
    quality_guarantee TEXT,
    status VARCHAR(50) DEFAULT 'available', -- available, sold, expired
    sold_at TIMESTAMP WITH TIME ZONE,
    order_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 订单表 (orders)
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    product_title VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price INTEGER NOT NULL, -- 以分为单位
    total_amount INTEGER NOT NULL, -- 以分为单位
    currency VARCHAR(10) DEFAULT 'CNY',
    contact_info VARCHAR(255) NOT NULL, -- 邮箱地址
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'pending',
    payment_transaction_id VARCHAR(255),
    card_secret_delivered_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    card_secret JSONB, -- 存储卡密信息的JSON对象
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 邮箱统计视图 (email_stats_view)
CREATE OR REPLACE VIEW email_stats_view AS
SELECT 
    contact_info as email,
    COUNT(*) as order_count,
    SUM(total_amount) as total_amount,
    MIN(created_at) as first_order_date,
    MAX(created_at) as last_order_date,
    ARRAY_AGG(
        json_build_object(
            'id', id,
            'order_number', order_number,
            'product_title', product_title,
            'total_amount', total_amount,
            'created_at', created_at,
            'payment_status', payment_status
        ) ORDER BY created_at DESC
    ) as orders
FROM orders 
WHERE contact_info IS NOT NULL AND contact_info != ''
GROUP BY contact_info
ORDER BY total_amount DESC;

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_card_secrets_product_id ON card_secrets(product_id);
CREATE INDEX IF NOT EXISTS idx_card_secrets_status ON card_secrets(status);
CREATE INDEX IF NOT EXISTS idx_orders_contact_info ON orders(contact_info);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 6. 创建触发器自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_card_secrets_updated_at BEFORE UPDATE ON card_secrets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用行级安全策略 (RLS)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 8. 创建安全策略 (允许所有操作，可根据需要调整)
CREATE POLICY "Enable all operations for products" ON products FOR ALL USING (true);
CREATE POLICY "Enable all operations for card_secrets" ON card_secrets FOR ALL USING (true);
CREATE POLICY "Enable all operations for orders" ON orders FOR ALL USING (true);

-- 9. 插入示例数据
INSERT INTO products (title, description, category, subcategory, price, stock, quality_guarantee, attributes) VALUES
('Google邮箱账号', '全新谷歌邮箱账号，支持Gmail、Drive、YouTube等全套服务', '邮箱账号', 'Google', 1500, 3, '质保首登，非人为问题7天包换', ARRAY['Gmail', 'Google Drive', 'YouTube', '质保首登']),
('Microsoft 365 个人版', 'Microsoft 365个人版账号，包含Office套件、OneDrive 1TB等', '办公软件', 'Microsoft', 2800, 2, '质保30天，包含完整Office套件', ARRAY['Office', 'OneDrive', 'Outlook', '1TB存储']),
('ChatGPT Plus 账号', 'ChatGPT Plus 高级账号，无限制使用GPT-4', 'AI工具', 'OpenAI', 5800, 2, '质保首登，支持GPT-4无限制使用', ARRAY['GPT-4', '无限制', '高优先级'])
ON CONFLICT DO NOTHING;

-- 10. 插入示例卡密数据
INSERT INTO card_secrets (product_id, account, password, additional_info, quality_guarantee, status)
SELECT 
    p.id,
    'testuser' || generate_series(1,3) || '@gmail.com',
    'encrypted_password_' || generate_series(1,3),
    '请妥善保管账号信息，建议立即修改密码',
    '质保首登，非人为问题7天包换',
    'available'
FROM products p 
WHERE p.title = 'Google邮箱账号'
ON CONFLICT DO NOTHING;
