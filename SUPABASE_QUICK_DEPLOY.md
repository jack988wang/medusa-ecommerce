# 🚀 Supabase 快速部署指南

## 📋 简化流程（跳过数据迁移）

由于 Render 上没有重要历史数据，可以直接切换到 Supabase，使用示例数据。

### ⚡ 快速步骤

#### 1️⃣ **创建 Supabase 项目**
1. 访问 [https://supabase.com](https://supabase.com)
2. 点击 "Start your project" → 使用 GitHub 登录
3. 创建新项目：
   - 项目名称：`medusa-card-shop`
   - 密码：生成并保存
   - 区域：选择最近的（如 Singapore）
4. 等待 2-3 分钟项目创建完成

#### 2️⃣ **设置数据库**
1. 在 Supabase Dashboard 中，点击 "SQL Editor"
2. 复制并粘贴 `backend/supabase-schema.sql` 的全部内容
3. 点击 "Run" 执行脚本
4. 验证表已创建：点击 "Table Editor" 查看 `products`, `card_secrets`, `orders` 表

#### 3️⃣ **获取连接信息**
1. 在项目仪表板中，点击 "Settings" → "API"
2. 复制以下信息：
   ```
   Project URL: https://your-project.supabase.co
   anon public: your-anon-key
   service_role: your-service-role-key
   ```

#### 4️⃣ **更新 Render 环境变量**
1. 登录 [Render Dashboard](https://dashboard.render.com)
2. 找到后端服务（如 `medusa-ecommerce-pr8p`）
3. 点击 "Environment" 标签
4. 添加/更新以下环境变量：
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
5. 保存配置

#### 5️⃣ **重新部署**
1. 在 Render Dashboard 中，点击后端服务的 "Manual Deploy"
2. 选择 "Deploy latest commit"
3. 等待部署完成（5-10 分钟）

#### 6️⃣ **验证部署**
1. 访问健康检查端点：`https://your-backend.onrender.com/health`
2. 检查响应中的 `database.type` 是否为 "Supabase"
3. 检查 `database.status` 是否为 "connected"

### 🔧 故障排除

#### 常见问题

**❌ 连接超时**
```bash
解决方案：检查 SUPABASE_URL 是否正确
```

**❌ 权限错误**
```bash
解决方案：确认使用了正确的 SUPABASE_ANON_KEY
```

**❌ 表不存在**
```bash
解决方案：重新执行 supabase-schema.sql 脚本
```

**❌ 环境变量未生效**
```bash
解决方案：重新部署 Render 服务
```

### 📊 验证清单

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建（products, card_secrets, orders）
- [ ] 环境变量已设置（SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY）
- [ ] Render 服务已重新部署
- [ ] 健康检查显示 Supabase 连接正常
- [ ] 管理后台可以创建产品
- [ ] 卡密上传功能正常
- [ ] 邮箱统计功能正常

### 🎯 预期结果

迁移完成后，您将获得：

- ✅ **数据持久化**：Render 重启不再丢失数据
- ✅ **并发安全**：多用户同时操作不会冲突
- ✅ **更好性能**：数据库索引和优化查询
- ✅ **自动备份**：Supabase 自动备份数据
- ✅ **监控面板**：实时查看数据库状态

### 📞 支持

如果遇到问题：
1. 查看 Render 部署日志
2. 检查 Supabase Dashboard 中的错误
3. 参考健康检查端点的响应
4. 必要时可以移除 Supabase 环境变量回退到文件系统

---

**⏱️ 预计时间：15-20 分钟**

**🎉 完成后，您的卡密商城将拥有企业级的数据存储能力！**
