import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    console.log('搜索参数:', query)

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { itemNo: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
        isActive: true
      },
      select: {
        id: true,
        itemNo: true,
        barcode: true,
        description: true,
        cost: true,
        supplier: true,
        images: {
          where: {
            isMain: true
          },
          select: {
            url: true
          },
          take: 1
        }
      },
      take: 10,
      orderBy: {
        itemNo: 'asc'
      }
    })

    // 转换数据格式
    const formattedProducts = products.map(product => ({
      id: product.id,
      itemNo: product.itemNo,
      barcode: product.barcode,
      description: product.description,
      picture: product.images[0]?.url || null,
      cost: product.cost,
      supplier: {
        name: product.supplier || ''
      }
    }))

    console.log('找到商品数量:', formattedProducts.length)

    return NextResponse.json(formattedProducts)
  } catch (error) {
    console.error('搜索商品失败:', error)
    return NextResponse.json(
      { error: '搜索商品失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 