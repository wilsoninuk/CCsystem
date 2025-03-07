# 商品管理模块

## 功能概述
商品管理模块用于管理所有商品信息，包括基本信息、图片、价格等。主要功能包括：
- 商品列表显示
- 商品信息筛选（按供应商、类别）
- 自定义显示列
- 商品导入/导出
- 批量删除
- 图片上传

## 目录结构
```
src/features/products/
├── README.md                 # 本文档
├── index.ts                  # 导出所有组件和类型
├── types.ts                  # 类型定义
└── components/
    ├── products-client.tsx   # 商品列表主组件
    ├── columns.tsx           # 表格列定义
    ├── import-dialog.tsx     # 导入对话框
    └── image-upload.tsx      # 图片上传组件
```

## 数据结构
商品信息包含以下字段：
- `id`: 唯一标识符
- `itemNo`: 商品编号（必填）
- `barcode`: 条形码（必填）
- `category`: 商品类别
- `description`: 商品描述（必填）
- `cost`: 成本价格（必填）
- `supplier`: 供应商
- `color`: 颜色/款式
- `material`: 材料
- `productSize`: 产品尺寸
- `cartonSize`: 装箱尺寸
- `cartonWeight`: 装箱重量(kg)
- `moq`: 最小订购量
- `link1688`: 1688链接
- `picture`: 商品主图URL（可选）
- `additionalPictures`: 附加图片URL数组（最多5张）
- `createdAt`: 创建时间
- `createdBy`: 创建者ID
- `updatedAt`: 更新时间
- `updatedBy`: 更新者ID
- `status`: 商品状态（active/inactive）

## 重要功能说明

### 1. 商品导入功能
- 支持 Excel 文件导入
- 导入时自动记录创建者和更新者信息
- 导入模板包含所有字段说明和示例数据
- 支持检测重复条形码，可选择更新或跳过
- 导入时必填字段：商品编号、条形码、商品描述、成本

注意事项：
- 导入时会自动关联当前登录用户作为创建者/更新者
- 更新已有商品时只更新商品信息，保留原创建者信息
- Excel文件大小不能超过10MB

### 2. 商品导出功能
- 支持导出选中商品或全部商品
- 导出格式为Excel，包含完整商品信息
- 导出文件包含商品图片
- 支持按供应商和类别筛选后导出

### 3. 图片上传功能
- 每个商品行都有独立的图片上传按钮
- 支持的图片格式：jpg、png、gif等
- 图片大小限制：最大5MB
- 上传成功后自动刷新显示

注意事项：
- 图片上传按钮位于商品图片列
- 上传时会自动压缩和优化图片
- 图片存储在服务器的 uploads 目录
- 更新图片时会自动删除旧图片

### 4. 用户权限和记录
- 所有商品操作都会记录操作者信息
- 创建商品时记录 createdBy
- 更新商品时记录 updatedBy
- 导入导出功能需要用户登录

## 常见问题处理
1. 导入失败：
   - 检查 Excel 文件格式是否正确
   - 确认必填字段是否完整
   - 查看是否有重复条形码

2. 图片上传失败：
   - 检查图片大小是否超限
   - 确认图片格式是否支持
   - 验证用户是否有上传权限

3. 导出失败：
   - 检查选中的商品数量
   - 确认筛选条件是否正确
   - 验证用户导出权限

## 使用说明

### 列表显示
- 默认显示所有必填字段
- 可通过"自定义列"按钮选择显示的字段
- 支持按供应商和类别筛选
- 支持按商品编号搜索

### 数据导入
- 支持Excel文件导入
- 自动检测重复条形码
- 可选择更新或跳过重复商品

### 数据导出
- 支持导出选中商品或全部商品
- 导出格式为Excel

### 图片上传
- 支持图片预览
- 自动压缩图片
- 支持拖拽上传

### 商品状态管理
- 商品默认为上架状态
- 可通过开关按钮快速切换商品上架/下架状态
- 下架商品不会出现在报价单等功能中
- 只有上架的商品可以被其他功能引用

## 注意事项
1. 必填字段：
   - 商品编号
   - 商品描述
   - 成本价格
  

2. 数据验证：
   - 条形码不允许重复
   - 成本价格必须大于0
   - 图片大小限制为5MB

3. 权限控制：
   - 创建者和更新者信息自动记录
   - 删除操作需要确认

## 后续优化计划
1. 添加商品分类管理
2. 支持批量修改功能
3. 添加商品历史记录
4. 优化图片压缩算法
5. 添加数据导出模板选择
6. 添加批量图片上传功能
7. 优化导入时的数据验证
8. 增加更多导出格式支持
9. 添加商品变更历史记录

## 相关API
- GET /api/products - 获取商品列表
- POST /api/products/import - 导入商品
- POST /api/products/export - 导出商品
- DELETE /api/products/batch - 批量删除商品
- POST /api/products/upload - 上传商品图片

## 用户认证与数据关联

### 通过 Email 获取用户 ID
在需要记录创建者/更新者信息的 API 中，我们使用以下方法获取用户 ID：

```typescript
// 1. 获取当前用户会话
const session = await getServerSession(authOptions)
if (!session?.user?.email) {
  return NextResponse.json(
    { error: "未授权访问" },
    { status: 401 }
  )
}

// 2. 通过 email 获取用户ID
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})

if (!user) {
  return NextResponse.json(
    { error: "用户不存在" },
    { status: 401 }
  )
}

// 3. 使用用户ID创建记录
const record = await prisma.someModel.create({
  data: {
    ...data,
    createdBy: user.id,
    updatedBy: user.id
  }
})
```

这种方法确保：
- 通过 session 验证用户是否登录
- 使用 email 查找用户获取其 ID
- 自动记录创建者和更新者信息 