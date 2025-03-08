import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"

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

    const { userId, isActive } = await request.json()

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

    // 不允许禁用管理员账号
    if (user.email === ADMIN_EMAIL) {
      return NextResponse.json(
        { error: "不能修改管理员账号状态" },
        { status: 400 }
      )
    }

    // 更新用户状态
    await prisma.user.update({
      where: { id: userId },
      data: { isActive }
    })

    return NextResponse.json({ 
      success: true,
      message: isActive ? "用户账号已启用" : "用户账号已禁用"
    })
  } catch (error) {
    console.error("修改用户状态失败:", error)
    return NextResponse.json(
      { error: "修改用户状态失败" },
      { status: 500 }
    )
  }
} 