import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "../[...nextauth]/route"

export async function POST(request: Request) {
  try {
    // 获取当前用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未登录" },
        { status: 401 }
      )
    }

    const { currentPassword, newPassword } = await request.json()

    // 获取用户信息
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 验证当前密码
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json(
        { error: "当前密码错误" },
        { status: 400 }
      )
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { email: session.user.email },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ 
      success: true,
      message: "密码修改成功" 
    })
  } catch (error) {
    console.error("修改密码失败:", error)
    return NextResponse.json(
      { error: "修改密码失败" },
      { status: 500 }
    )
  }
} 