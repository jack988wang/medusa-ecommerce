# 🚀 Supabase 迁移指南

## 📋 概述

本指南将帮助您将卡密商城系统从文件系统存储迁移到 Supabase 数据库，解决持久化和并发一致性问题。

## 🎯 迁移优势

### ✅ **解决的问题**
- **数据持久化**：Render 重启不再丢失数据
- **并发一致性**：多用户同时操作不会产生数据冲突
- **性能优化**：数据库索引和查询优化
- **数据备份**：自动备份和恢复机制
- **扩展性**：支持更大规模的数据和用户

### 🔄 **平滑迁移**
- 使用适配器模式，可以无缝切换
- 保留现有功能，不影响用户体验
- 支持回滚到文件系统模式

## 📋 迁移步骤

### 步骤 1：创建 Supabase 项目

1. **访问 Supabase**
   - 打开 [https://supabase.com](https://supabase.com)
   - 点击 "Start your project"
   - 使用 GitHub 账号登录

2. **创建新项目**
   - 点击 "New Project"
   - 选择组织（或创建新组织）
   - 项目名称：`medusa-card-shop`
   - 数据库密码：生成强密码并保存
   - 选择区域：`Asia Pacific (Singapore)` 或 `US East (N. Virginia)`
   - 点击 "Create new project"

3. **等待项目创建完成**
   - 通常需要 2-3 分钟
   - 项目创建完成后会显示仪表板

### 步骤 2：配置数据库

1. **获取连接信息**
   - 在项目仪表板中，点击 "Settings" → "Database"
   - 复制以下信息：
     - Project URL
     - API Keys → anon public
     - API Keys → service_role (secret)

2. **创建数据库表**
   - 点击左侧 "SQL Editor"
   - 复制 `backend/supabase-schema.sql` 的内容
   - 粘贴到 SQL 编辑器中
   - 点击 "Run" 执行 SQL 脚本

3. **验证表创建**
   - 点击左侧 "Table Editor"
   - 确认以下表已创建：
     - `products`
     - `card_secrets`
     - `orders`
     - `email_stats_view` (视图)

### 步骤 3：配置环境变量

1. **更新 Render 环境变量**
   - 登录 [Render Dashboard](https://dashboard.render.com)
   - 找到后端服务 `medusa-ecommerce-pr8p`
   - 点击 "Environment" 标签
   - 添加以下环境变量：

   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **验证环境变量**
   - 确保所有 Supabase 相关变量都已设置
   - 保存配置

### 步骤 4：部署更新

1. **重新部署后端服务**
   - 在 Render Dashboard 中
   - 点击后端服务的 "Manual Deploy" 按钮
   - 选择 "Deploy latest commit"
   - 等待部署完成（约 5-10 分钟）

2. **验证部署**
   - 检查部署日志，确认没有错误
   - 测试 API 端点是否正常响应

### 步骤 5：数据迁移（可选）

由于 Render 上没有重要历史数据，可以跳过数据迁移步骤，直接使用 Supabase 中的示例数据。

如果需要迁移现有数据：

1. **导出文件系统数据**
   ```bash
   # 在本地运行
   cd medusa-ecommerce/backend
   npm run export-data
   ```

2. **导入到 Supabase**
   - 使用 Supabase Dashboard 的 "Table Editor"
   - 或者创建数据导入脚本

### 步骤 6：功能验证

1. **测试产品管理**
   - 访问管理后台
   - 创建新产品
   - 验证数据是否保存到 Supabase

2. **测试卡密管理**
   - 上传卡密
   - 验证库存更新
   - 检查卡密状态

3. **测试订单系统**
   - 创建测试订单
   - 验证支付流程
   - 检查邮箱统计功能

4. **测试邮箱统计**
   - 访问管理后台的邮箱统计页面
   - 验证数据正确显示

## 🔧 故障排除

### 常见问题

1. **连接超时**
   ```
   解决方案：检查 SUPABASE_URL 是否正确
   ```

2. **权限错误**
   ```
   解决方案：确认使用了正确的 API Key
   ```

3. **表不存在**
   ```
   解决方案：重新执行 supabase-schema.sql
   ```

4. **环境变量未生效**
   ```
   解决方案：重新部署 Render 服务
   ```

### 调试步骤

1. **检查日志**
   ```bash
   # 查看 Render 部署日志
   # 确认数据库连接状态
   ```

2. **测试连接**
   ```bash
   # 使用 Supabase Dashboard 的 SQL Editor
   # 执行简单查询验证连接
   ```

3. **回滚方案**
   - 如果出现问题，可以临时移除 Supabase 环境变量
   - 系统会自动回退到文件系统模式

## 📊 性能对比

| 指标 | 文件系统 | Supabase |
|------|----------|----------|
| 数据持久化 | ❌ | ✅ |
| 并发支持 | ❌ | ✅ |
| 查询性能 | 慢 | 快 |
| 备份恢复 | 手动 | 自动 |
| 扩展性 | 有限 | 优秀 |
| 维护成本 | 高 | 低 |

## 🎉 迁移完成

迁移完成后，您将获得：

- ✅ **可靠的数据存储**：不再担心数据丢失
- ✅ **更好的性能**：数据库索引和优化查询
- ✅ **并发安全**：多用户同时操作不会冲突
- ✅ **自动备份**：Supabase 自动备份数据
- ✅ **监控面板**：实时查看数据库状态

## 📞 支持

如果在迁移过程中遇到问题：

1. 查看 Render 部署日志
2. 检查 Supabase Dashboard 中的错误
3. 参考本文档的故障排除部分
4. 必要时可以回滚到文件系统模式

---

**注意**：迁移过程中请保持系统稳定运行，建议在低峰期进行迁移操作。
