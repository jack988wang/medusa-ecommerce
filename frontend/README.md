# Medusa Frontend for Cloudflare Pages

这是一个为 Cloudflare Pages 优化的 Medusa Next.js 前端项目。

## 功能特性

- ✅ Next.js 14 + TypeScript
- ✅ Tailwind CSS 样式
- ✅ 静态导出（适合 Cloudflare Pages）
- ✅ 响应式设计
- ✅ 产品展示和购物车功能

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 部署到 Cloudflare Pages

1. 将代码推送到 GitHub 仓库
2. 在 Cloudflare Pages 控制台连接 GitHub 仓库
3. 构建设置：
   - Framework preset: Next.js
   - Build command: `npm ci && npm run build && npm run export`
   - Build output directory: `out`
4. 环境变量：
   - `NEXT_PUBLIC_MEDUSA_BACKEND_URL`: 你的 Medusa 后端 URL

## 环境变量

| 变量名 | 描述 | 必需 |
|--------|------|------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | Medusa 后端 API URL | ✅ |

## 项目结构

```
medusa-frontend-pages/
├── pages/
│   ├── index.tsx          # 首页
│   └── _app.tsx          # App 组件
├── styles/
│   └── globals.css       # 全局样式
├── public/               # 静态资源
├── next.config.js        # Next.js 配置
├── tailwind.config.js    # Tailwind 配置
└── package.json
```

## 自定义

- 修改 `pages/index.tsx` 来自定义首页
- 在 `styles/globals.css` 中添加自定义样式
- 更新 `tailwind.config.js` 来定制主题

## 支持

- Medusa 文档：https://docs.medusajs.com/
- Next.js 文档：https://nextjs.org/docs
- Cloudflare Pages 文档：https://developers.cloudflare.com/pages/

