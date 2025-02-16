# 商业管理系统

基于 Next.js 14 开发的现代化商业管理系统，专注于商品管理、报价和订单分析。

## 开发进度

### 已完成
- [x] 项目初始化
  - [x] Next.js 14 项目创建
  - [x] TypeScript 配置
  - [x] TailwindCSS 设置
  
- [x] 数据库设置
  - [x] PostgreSQL 安装和配置
  - [x] Prisma ORM 设置
  - [x] 数据库模型定义
    - [x] User 模型
    - [x] Product 模型（使用 barcode 作为主键）
    - [x] Customer 模型
    - [x] CustomerProductPrice 模型
    - [x] Quotation 模型
    - [x] QuotationItem 模型
    - [x] OrderAnalysis 模型

### 进行中
- [ ] 基础UI组件开发
  - [ ] 布局组件
  - [ ] 导航组件
  - [ ] 数据表格组件

### 待开发
- [ ] 用户认证
- [ ] 商品管理模块
- [ ] 客户管理模块
- [ ] 报价管理模块
- [ ] 订单分析模块
- [ ] 利润分析模块

## 技术栈

- Next.js 14
- TypeScript
- PostgreSQL (主数据库)
- Prisma (ORM)
- TailwindCSS (样式)
- Shadcn/ui (UI组件)
- React Query (数据获取)
- React Hook Form (表单处理)

## 本地开发

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
# .env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/trade_system?schema=public"
```

3. 运行数据库迁移
```bash
npx prisma migrate dev
```

4. 启动开发服务器
```bash
npm run dev
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
