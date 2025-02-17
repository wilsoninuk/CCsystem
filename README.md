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

- [x] 商品管理模块
  - [x] 商品列表展示
  - [x] 商品数据导入导出
    - [x] Excel 模板生成
    - [x] Excel 数据导入
      - [x] 支持图片 URL 导入
      - [x] 数据验证和错误处理
      - [x] 支持新增和更新操作
    - [x] Excel 数据导出
  - [x] 商品表格组件
    - [x] 自定义列显示
    - [x] 排序和搜索功能
    - [x] 展开/收起详情

### 进行中
- [ ] 商品管理模块优化
  - [ ] 批量删除功能
  - [ ] 商品编辑功能
  - [ ] 商品详情页面

### 待开发
- [ ] 用户认证
- [ ] 客户管理模块
- [ ] 报价管理模块
- [ ] 订单分析模块
- [ ] 利润分析模块

## 今日工作总结（2024-02-16）
1. 优化了商品导入功能
   - 简化了图片处理逻辑，改为仅支持图片 URL
   - 改进了数据验证和错误处理
   - 添加了更详细的导入模板说明
   - 修复了重复数据导入的问题

2. 改进了错误处理
   - 添加了更友好的错误提示
   - 优化了验证错误的展示方式
   - 完善了日志输出

3. 优化了代码结构
   - 删除了不必要的图片压缩代码
   - 简化了数据处理流程
   - 改进了类型定义

## 下一步计划
1. 实现商品编辑功能
2. 添加批量删除功能
3. 开发商品详情页面
4. 优化用户界面和交互体验

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
