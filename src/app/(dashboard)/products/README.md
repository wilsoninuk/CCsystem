# 商品管理模块

## 功能概述

商品管理模块提供了完整的商品信息管理功能，包括：

1. 基础信息管理
   - 商品的增删改查
   - 批量导入导出
   - 商品状态管理（上线/下线）
   - 自定义显示列

2. 图片管理
   - 主图设置
   - 多图片上传
   - 图片预览和删除
   - 图片排序

3. 筛选和搜索
   - 按供应商筛选
   - 按类别筛选
   - 按状态筛选
   - 商品编号搜索

## 技术架构

### 前端组件结构

```
src/app/(dashboard)/products/
├── components/                # 组件目录
│   ├── create-product-dialog  # 新增商品对话框
│   ├── edit-product-form     # 编辑商品表单
│   ├── import-dialog         # 导入对话框
│   ├── column-select-dialog  # 列选择对话框
│   ├── image-gallery         # 图片画廊组件
│   └── multi-image-upload    # 多图片上传组件
├── products-client.tsx       # 主客户端组件
├── columns.tsx              # 表格列定义
└── page.tsx                 # 页面入口
```

### 数据服务

商品相关的所有 API 调用都封装在 `ProductService` 类中（`src/lib/services/product.service.ts`）：

```typescript
class ProductService {
  static async getProducts()                    // 获取所有商品
  static async getProduct(id)                   // 获取单个商品
  static async createProduct(data)              // 创建商品
  static async updateProduct(id, data)          // 更新商品
  static async updateProductStatus(id, status)  // 更新商品状态
  static async updateProductImages(id, images)  // 更新商品图片
  static async importProducts(file)             // 导入商品
  static async exportProducts(ids?)             // 导出商品
  static async downloadTemplate()               // 下载导入模板
  static async uploadImage(file)                // 上传图片
}
```

## 数据结构

### 商品基础信息 (Product)

```typescript
interface Product {
  id: string
  itemNo: string            // 商品编号
  barcode: string          // 条形码
  description: string      // 商品描述
  cost: number            // 成本
  category?: string       // 类别
  supplier?: string       // 供应商
  color?: string         // 颜色/款式
  material?: string      // 材料
  productSize?: string   // 产品尺寸
  moq?: number          // 最小起订量
  cartonSize?: string   // 装箱尺寸
  cartonWeight?: number // 装箱重量
  link1688?: string     // 1688链接
  picture?: string      // 主图
  additionalPictures: string[] // 附加图片
  isActive: boolean     // 商品状态
  createdAt: Date       // 创建时间
  updatedAt: Date       // 更新时间
  createdBy?: string    // 创建者ID
  updatedBy?: string    // 更新者ID
}
```

### 导入结果 (ImportResult)

```typescript
interface ImportResult {
  created: number           // 新建数量
  updated: number          // 更新数量
  duplicates?: DuplicateProduct[] // 重复商品
}
```

## API 接口

### 商品基础操作

- GET `/api/products` - 获取商品列表
- GET `/api/products/:id` - 获取单个商品
- POST `/api/products` - 创建商品
- PATCH `/api/products/:id` - 更新商品
- PATCH `/api/products/:id/status` - 更新商品状态
- PATCH `/api/products/:id/images` - 更新商品图片
- DELETE `/api/products/batch` - 批量删除商品

### 导入导出

- POST `/api/products/import` - 导入商品
- POST `/api/products/export` - 导出商品
- GET `/api/products/template` - 获取导入模板

### 图片上传

- POST `/api/upload` - 上传图片

## 使用示例

### 1. 获取商品列表

```typescript
import { ProductService } from "@/lib/services/product.service"

const products = await ProductService.getProducts()
```

### 2. 创建商品

```typescript
const newProduct = await ProductService.createProduct({
  itemNo: "ITEM001",
  barcode: "6901234567890",
  description: "示例商品",
  cost: 99.99,
  isActive: true
})
```

### 3. 更新商品状态

```typescript
await ProductService.updateProductStatus(productId, false) // 下线商品
```

### 4. 导入商品

```typescript
const result = await ProductService.importProducts(file)
if (result.duplicates) {
  // 处理重复商品
} else {
  console.log(`成功导入${result.created}个商品`)
}
```

## 注意事项

1. **图片上传**
   - 支持的格式：jpg, jpeg, png, gif, webp
   - 图片大小限制：1MB
   - 图片会自动压缩和优化

2. **导入导出**
   - 导入时必填字段：商品编号、条形码、商品描述、成本
   - 导入支持更新现有商品
   - 导出支持选择性导出

3. **性能优化**
   - 使用服务端组件减少客户端负载
   - 图片懒加载
   - 状态管理优化

4. **错误处理**
   - 所有API调用都有适当的错误处理
   - 用户友好的错误提示
   - 详细的错误日志

## 后续优化计划

1. 添加商品批量操作功能
   - 批量更新状态
   - 批量修改类别/供应商
   - 批量设置价格

2. 优化图片管理
   - 图片压缩优化
   - 图片批量上传
   - 图片排序持久化

3. 增强数据验证
   - 更严格的字段验证
   - 自定义验证规则
   - 重复数据检查

4. 性能优化
   - 实现虚拟滚动
   - 优化大数据量处理
   - 添加数据缓存

## 维护记录

| 日期 | 版本 | 更新内容 | 负责人 |
|------|------|----------|--------|
| 2024-03-xx | 1.0.0 | 初始版本 | Eleven |

## 贡献指南

1. 代码规范
   - 使用 TypeScript 严格模式
   - 遵循 ESLint 规则
   - 编写清晰的注释

2. 提交规范
   - feat: 新功能
   - fix: 修复bug
   - docs: 文档更新
   - style: 代码格式
   - refactor: 重构
   - test: 测试
   - chore: 构建过程或辅助工具的变动

## 联系方式

如有问题或建议，请联系：
- 作者：Eleven
- 项目来源：Eleven 