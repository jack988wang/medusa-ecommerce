# Medusa E-commerce Platform

## 🚀 项目简介
基于Medusa.js构建的现代化电商平台，包含前端、后端和数据库服务。

## 📁 项目结构
```
medusa-ecommerce/
├── backend/          # 后端API服务 (Express.js + TypeScript)
├── frontend/         # 前端应用 (Next.js + Tailwind CSS)
├── docker-compose.yml        # 本地开发环境
├── docker-compose.prod.yml   # 生产环境
├── railway.json              # Railway部署配置
└── README.md                 # 项目说明
```

## 🛠️ 技术栈
- **后端**: Express.js, TypeScript, PostgreSQL, Redis
- **前端**: Next.js, React, Tailwind CSS
- **数据库**: PostgreSQL + Redis
- **部署**: Docker, Railway, ClawCloud Run

## 🚀 快速开始

### 本地开发
```bash
# 启动所有服务
docker-compose up -d

# 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:9000
# 管理后台: http://localhost:3000/admin
```

### 生产部署
```bash
# 生产环境部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 部署平台
- **ClawCloud Run**: 一键部署，免费额度
- **Railway**: 支持Docker容器
- **Render**: 免费应用部署

## 📋 功能特性
- ✅ 商品管理
- ✅ 购物车功能
- ✅ 订单管理
- ✅ 支付集成
- ✅ 用户管理
- ✅ 管理后台
- ✅ 邮箱统计

## 🔧 环境配置
复制 `.env.example` 到 `.env` 并配置相应环境变量。

## 📝 开发说明
- 后端API文档: `/api/docs`
- 前端组件: `/frontend/pages`
- 数据库模型: `/backend/src/models`

## 🤝 贡献
欢迎提交Issue和Pull Request！

## 📄 许可证
MIT License
