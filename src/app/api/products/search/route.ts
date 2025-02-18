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
          { itemNo: { contains: query, mode: 'insensitive' } },     // 添加 insensitive
          { barcode: { contains: query, mode: 'insensitive' } },    // 添加 insensitive
          { description: { contains: query, mode: 'insensitive' } }, // 添加 insensitive
        ],
        isActive: true
      },
      select: {
        id: true,
        itemNo: true,
        barcode: true,
        description: true,
        picture: true,
        cost: true,
      },
      take: 10,
      orderBy: {
        itemNo: 'asc'
      }
    })

    console.log('找到商品数量:', products.length)
    console.log('商品列表:', products)

    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        itemNo: true,
        barcode: true,
        description: true,
        picture: true,
        cost: true,
      },
      take: 10
    });

    console.log('所有商品:', allProducts);

    if (allProducts.length === 0) {
      console.log('数据库中没有商品数据');
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('搜索商品失败:', error)
    return NextResponse.json(
      { error: '搜索商品失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 