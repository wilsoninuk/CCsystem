import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"
const DEFAULT_PASSWORD = "123456" // 默认密码

export async function POST(request: Request) {
  try {
    // 检查是否是管理员
    const session = await getServerSession(authOptions)
    if (session?.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "未授权的操作" },
        { status: 401 }
      )
    }

    const { userId } = await request.json()

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 重置密码为默认密码
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ 
      success: true,
      message: "密码已重置为: " + DEFAULT_PASSWORD
    })
  } catch (error) {
    console.error("重置密码失败:", error)
    return NextResponse.json(
      { error: "重置密码失败" },
      { status: 500 }
    )
  }
} 