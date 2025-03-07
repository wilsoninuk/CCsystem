import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { email, newPassword } = await request.json()

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 404 }
      )
    }

    // 重置密码
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ 
      success: true,
      message: "密码重置成功" 
    })
  } catch (error) {
    console.error("重置密码失败:", error)
    return NextResponse.json(
      { error: "重置密码失败" },
      { status: 500 }
    )
  }
} 