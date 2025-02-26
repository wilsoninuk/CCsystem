# 用户认证模块说明

## 目录结构
```
(auth)/
├── README.md
├── login/
│   └── page.tsx        # 登录页面
├── reset-password/     # 重置密码功能
│   └── page.tsx        # 重置密码页面
└── components/
    └── login-form.tsx  # 登录表单组件
```

## 核心功能
1. 用户认证
   - 使用 NextAuth.js 处理用户认证
   - JWT 策略保存会话状态
   - 密码使用 bcrypt 加密存储

2. 密码重置
   - 支持通过邮箱重置密码
   - 重置后的默认密码为 admin123
   - 重置密码 API 路由: /api/auth/reset-password

3. 数据模型
```prisma
model User {
  id         String      @id @default(cuid())
  email      String      @unique
  name       String
  password   String
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  // 关联关系
  createdProducts Product[] @relation("ProductCreator")
  updatedProducts Product[] @relation("ProductUpdater")
}
```

## 关键实现

### 1. 认证配置 (src/app/api/auth/[...nextauth]/route.ts)
- 使用 Credentials Provider 处理邮箱密码登录
- 自定义 session 回调确保用户 ID 可用
- 使用 Prisma Adapter 处理数据库操作

### 2. 密码重置流程
1. 用户访问重置密码页面 (/reset-password)
2. 输入注册邮箱
3. 系统验证邮箱是否存在
4. 重置密码为默认值 (admin123)
5. 返回登录页面

### 3. 中间件保护 (src/middleware.ts)
- 保护需要认证的路由
- 自动重定向未登录用户到登录页面
- 配置白名单路由

### 4. 组件封装
- 登录表单组件 (login-form.tsx)
- 重置密码表单 (reset-password/page.tsx)
- 使用 Server Components 优化性能
- 错误处理和加载状态管理

## 使用方法

### 1. 登录系统
- 访问 /login
- 输入邮箱和密码
- 默认管理员账号：
  - 邮箱：wilsoninuk@gmail.com
  - 密码：admin123

### 2. 重置密码
- 点击登录页面的"忘记密码？"
- 输入注册邮箱
- 系统会重置密码为：admin123
- 使用新密码登录

### 3. 获取当前用户
```typescript
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

const session = await getServerSession(authOptions)
const userId = session?.user?.id
```

## 注意事项

1. 安全性
   - 所有密码必须加密存储
   - 避免在客户端暴露敏感信息
   - 使用 middleware 保护路由

2. 密码重置
   - 目前使用固定密码重置方案
   - 后续可以改进为邮件验证
   - 建议用户首次登录后修改密码

3. 错误处理
   - 统一的错误提示格式
   - 合适的错误重定向
   - 完善的日志记录

## 后续优化计划
1. 添加邮件验证重置密码
2. 实现密码强度检查
3. 添加登录尝试次数限制
4. 实现记住登录状态功能
5. 添加双因素认证支持

## 常见问题

1. 用户关联丢失
   - 检查 createdBy/updatedBy 字段是否正确设置
   - 确认外键约束是否正确
   - 验证用户 ID 格式

2. 认证失败
   - 检查 session 是否正确
   - 确认 middleware 配置
   - 验证路由权限设置 