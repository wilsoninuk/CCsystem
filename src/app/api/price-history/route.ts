import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { convertToBeijingMidnight } from "@/lib/utils"

export async function POST(request: Request) {
  try {
    const { productIds, customerId } = await request.json()

    // 查询每个产品的最新出货记录
    const historyRecords = await prisma.customerProductHistory.findMany({
      where: {
        customerId: customerId,
        productId: { in: productIds },
        shippedAt: {
          lt: new Date()
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

    // 为每个产品找到最新的出货记录
    const historyPrices: Record<string, any> = {}
    const processedProductIds = new Set<string>()

    // 由于记录已经按shippedAt降序排序，第一次遇到的记录就是最新的
    for (const record of historyRecords) {
      if (!processedProductIds.has(record.productId)) {
        // 调整日期格式：将时间转换为北京时间午夜时分
        const shippedDate = record.shippedAt ? convertToBeijingMidnight(record.shippedAt) : null

        historyPrices[record.productId] = {
          price: record.priceRMB,
          date: shippedDate,
          status: 'SHIPPED',
          customerId
        }
        processedProductIds.add(record.productId)
      }
    }

    // 为没有找到历史记录的产品设置空值
    for (const productId of productIds) {
      if (!historyPrices[productId]) {
        historyPrices[productId] = {
          price: null,
          date: null,
          status: null,
          customerId
        }
      }
    }

    return NextResponse.json(historyPrices)
  } catch (error) {
    console.error('获取历史价格失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取历史价格失败' },
      { status: 500 }
    )
  }
} 