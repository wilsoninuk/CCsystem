import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { id: string; productId: string } }
) {
  try {
    const customerId = params.id
    const { productId } = params

    // 获取最新的报价记录
    const priceRecord = await prisma.customerProductPrice.findFirst({
      where: {
        AND: [
          { customerId },
          { product: { id: productId } }
        ]
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    if (!priceRecord) {
      return NextResponse.json({ price: null })
    }

    return NextResponse.json({ price: priceRecord.price })
  } catch (error) {
    console.error('获取商品历史报价失败:', error)
    return NextResponse.json(
      { error: '获取商品历史报价失败' },
      { status: 500 }
    )
  }
} 