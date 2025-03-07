import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const productIds = searchParams.get('productIds')?.split(',') || []
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      )
    }

    console.log('正在查询历史价格:', {
      customerId,
      productIds
    })

    // 查询每个产品的最新出货记录
    const historyRecords = await prisma.customerProductHistory.findMany({
      where: {
        customerId: customerId,
        productId: { in: productIds },
        shippedAt: {
          not: undefined
        }
      },
      orderBy: {
        shippedAt: 'desc'
      },
      select: {
        productId: true,
        priceRMB: true,
        shippedAt: true
      }
    })

    console.log('查询到的出货记录数量:', historyRecords.length)
    console.log('查询到的出货记录:', historyRecords)

    // 为每个产品找到最新的出货记录
    const historyPrices: Record<string, any> = {}
    const processedProductIds = new Set<string>()

    // 由于记录已经按shippedAt降序排序，第一次遇到的记录就是最新的
    for (const record of historyRecords) {
      if (!processedProductIds.has(record.productId)) {
        const historyPrice = {
          price: record.priceRMB,
          date: record.shippedAt,
          status: 'SHIPPED',
          customerId
        }
        historyPrices[record.productId] = historyPrice
        processedProductIds.add(record.productId)
      }
    }

    // 转换为前端期望的格式
    const result = Object.fromEntries(
      productIds.map(productId => [
        productId,
        historyPrices[productId] || {
          price: null,
          date: null,
          status: null,
          customerId
        }
      ])
    )

    console.log('返回的历史价格数据:', result)

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取历史价格失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history prices' },
      { status: 500 }
    )
  }
} 