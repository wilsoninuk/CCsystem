import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { itemNos } = await request.json()

    if (!Array.isArray(itemNos) || itemNos.length === 0) {
      return NextResponse.json(
        { success: false, error: '无效的商品编号列表' },
        { status: 400 }
      )
    }

    const result = await prisma.product.deleteMany({
      where: {
        itemNo: {
          in: itemNos
        }
      }
    })

    return NextResponse.json({
      success: true,
      count: result.count
    })
  } catch (error) {
    console.error('删除失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '删除失败'
      },
      { status: 500 }
    )
  }
} 