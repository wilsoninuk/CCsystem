import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"

export default withAuth({
  pages: {
    signIn: '/login'
  }
})

// 更新 matcher 配置，包含根路径
export const config = {
  matcher: [
    "/products/:path*",  // 这里可能需要修改
    "/customers/:path*",
    "/quotations/:path*",
    "/users/:path*",
  ]
} 