import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
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

    const { isActive } = await request.json()

    // 3. 更新商品状态
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        isActive,
        updatedBy: user.id
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('更新商品状态失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新商品状态失败' },
      { status: 500 }
    )
  }
} 