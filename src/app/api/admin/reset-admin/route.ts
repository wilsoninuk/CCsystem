import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"
const DEFAULT_PASSWORD = "admin123"

export async function POST(request: Request) {
  try {
    // 生成新的加密密码
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)

    // 更新管理员密码
    const user = await prisma.user.update({
      where: { email: ADMIN_EMAIL },
      data: { password: hashedPassword }
    })

    if (!user) {
      return NextResponse.json(
        { error: "管理员用户不存在" },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: "管理员密码已重置为: " + DEFAULT_PASSWORD
    })
  } catch (error) {
    console.error("重置管理员密码失败:", error)
    return NextResponse.json(
      { error: "重置管理员密码失败" },
      { status: 500 }
    )
  }
} 