import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    const { isActive } = await request.json()

    // 更新商品状态
    const product = await prisma.product.update({
      where: { id: params.id },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('更新商品状态失败:', error)
    return NextResponse.json(
      { error: '更新商品状态失败' },
      { status: 500 }
    )
  }
} 