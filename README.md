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
      - [x] 重复条形码检查和处理
    - [x] Excel 数据导出
      - [x] 支持图片导出
      - [x] 自定义列导出
      - [x] 数据格式化
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
1. 修复了商品导入功能
   - 修复了导入对话框显示问题
   - 改进了数据验证和错误处理
   - 添加了重复条形码检查
   - 优化了用户界面和交互体验

2. 完善了导出功能
   - 修复了图片导出的对齐问题
   - 优化了数据格式化
   - 改进了错误处理

3. 优化了代码结构
   - 重构了导入导出相关组件
   - 改进了类型定义
   - 添加了更详细的错误日志

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

## 环境变量配置

### 本地开发环境
```bash
# .env
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/trade_system?schema=public"
```

### Vercel 生产环境
以下是生产环境需要的环境变量：

1. 数据库相关（由 Vercel Postgres 自动配置）：
- POSTGRES_PRISMA_URL
- POSTGRES_URL_NON_POOLING
- 其他数据库相关变量...

2. NextAuth 认证相关：
- NEXTAUTH_SECRET="c8f12f4b89c6e9f158b24fb4c7c7c1c8f12f4b89c6e9f158b24fb4c7c7c1"
- NEXTAUTH_URL="https://你的项目域名.vercel.app"

注意：NEXTAUTH_SECRET 是用于加密会话的密钥，请勿在生产环境中更改此值，否则所有用户都需要重新登录。

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

# 已知问题与解决方案

## ExcelJS 导出图片的最佳实践

### 1. 对齐问题解决方案
在使用 ExcelJS 导出带图片的 Excel 文件时，如果先添加数据再添加图片，会导致单元格对齐问题。

### 2. 图片导出解决方案

#### 问题描述
在导出 Excel 时，需要将图片 URL 转换为实际图片嵌入到 Excel 文件中。

#### 解决方案
采用"先图片后数据"的处理顺序：
1. 先处理并添加所有图片
2. 再添加文字数据
3. 最后设置样式

#### 关键步骤
1. 不要直接使用图片 URL
2. 使用 fetch 获取图片二进制数据
3. 将图片数据转换为 ArrayBuffer
4. 使用 workbook.addImage 添加图片
5. 使用 worksheet.addImage 将图片放置到指定单元格

#### 注意事项
1. 需要处理图片加载失败的情况
2. 考虑图片格式的兼容性（jpeg, png 等）
3. 处理跨域问题（可能需要代理服务器）
4. 设置适当的图片尺寸和位置

#### 完整示例
```typescript
if (product.picture) {
  try {
    // 获取图片数据
    const imageResponse = await fetch(product.picture)
    if (!imageResponse.ok) {
      console.error('获取图片失败:', product.picture)
      continue
    }

    // 转换为 ArrayBuffer
    const imageArrayBuffer = await imageResponse.arrayBuffer()

    // 添加到工作簿
    const imageId = workbook.addImage({
      buffer: imageArrayBuffer,
      extension: 'jpeg',
    })

    // 设置图片位置和大小
    worksheet.addImage(imageId, {
      tl: { col: 0, row: rowNumber - 1 },
      br: { col: 1, row: rowNumber },
      editAs: 'oneCell'
    } as any)

    // 调整行高以适应图片
    worksheet.getRow(rowNumber).height = 80
  } catch (error) {
    console.error('添加图片失败:', error, product.picture)
  }
}
```

#### 相关文件
- src/app/api/products/export/route.ts
- src/app/api/image/route.ts（用于处理跨域图片）

## 商品图片管理指南

### Cloudinary 配置
1. Cloud Name: duiecmcry
2. API Key: 298213994547619
3. API Secret: mLG7TZqfdEG5cqjVPIvWH-FT5j8

### 图片命名规则
1. 主图：直接使用商品条形码作为文件名
   - 示例：`12345678.jpg`

2. 附图：使用条形码加下划线和序号（最多4张）
   - 示例：
     - 附图1：`12345678_1.jpg`
     - 附图2：`12345678_2.jpg`
     - 附图3：`12345678_3.jpg`
     - 附图4：`12345678_4.jpg`

### 使用说明
1. 所有图片必须上传到 Cloudinary 的 `/products` 文件夹
2. 主图是必需的，附图是可选的
3. 附图必须按顺序命名，不能跳过序号
   - 正确：使用 _1, _2, _3
   - 错误：使用 _1, _3, _4（跳过了 _2）
4. 图片格式建议统一使用 jpg 或 png

### 图片管理流程
1. 在 Cloudinary 后台上传图片时，将图片重命名为对应的商品条形码
2. 系统会自动根据商品条形码关联对应的图片
3. 如果需要修改条形码，需要同时在 Cloudinary 中重命名图片

### 注意事项
- 确保图片格式统一（推荐使用 jpg 或 png）
- 图片尺寸建议不超过 1MB
- 如需更新商品图片，只需在 Cloudinary 上用相同的名称上传新图片即可

## 特殊功能说明

### 商品删除机制
系统采用特殊的软删除机制，不直接从数据库中删除商品记录，而是通过更新时间标记来实现：

1. **实现方式**
   - 使用 `updatedAt` 字段作为删除标记
   - 当商品被"删除"时，将其 `updatedAt` 设置为 2000-01-01
   - 在查询时过滤掉这些被标记的商品

2. **设计原因**
   - 保持数据完整性
   - 不影响历史报价记录
   - 不影响出货记录
   - 不影响商业发票
   - 避免修改数据库结构

3. **与商品上下线的区别**
   - 商品上下线使用 `isActive` 字段控制
   - 上下线的商品都会显示在列表中
   - 被"删除"的商品不会显示在列表中

4. **恢复已删除商品**
   - 在商品列表页面可以切换显示已删除商品
   - 选择需要恢复的商品，点击"恢复"按钮
   - 系统会将商品的 `updatedAt` 更新为当前时间
   - 恢复后的商品会重新出现在正常商品列表中

5. **相关文件**
   - `src/app/api/products/route.ts`（商品列表查询）
   - `src/app/api/products/batch/route.ts`（批量删除功能）
   - `src/app/api/products/restore/route.ts`（恢复已删除商品）
