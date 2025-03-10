import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function POST(request: Request) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 401 }
      )
    }

    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "无效的商品ID列表" },
        { status: 400 }
      )
    }

    // 恢复商品
    const result = await prisma.product.updateMany({
      where: {
        id: { in: ids },
        updatedAt: new Date('2000-01-01')
      },
      data: {
        updatedAt: new Date(),
        updatedBy: user.id
      }
    })

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    console.error('恢复商品失败:', error)
    return NextResponse.json(
      { error: "恢复商品失败" },
      { status: 500 }
    )
  }
} 