import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { ids } = await request.json()

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "无效的商品ID列表" },
        { status: 400 }
      )
    }

    // 软删除：将商品标记为已删除
    const result = await prisma.product.updateMany({
      where: {
        id: {
          in: ids
        }
      },
      data: {
        isDeleted: true,
        updatedAt: new Date(),
        updatedBy: session.user.id
      }
    })

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    console.error('批量删除失败:', error)
    return NextResponse.json(
      { error: `批量删除失败: ${error instanceof Error ? error.message : '未知错误'}` },
      { status: 500 }
    )
  }
} 