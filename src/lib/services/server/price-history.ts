import { prisma } from "@/lib/prisma"
import { HistoryPrice } from "../price-history"
import { convertToBeijingMidnight } from "@/lib/utils"

/**
 * 服务器端获取历史价格
 */
export async function getProductsHistoryPricesServer(
  productIds: string[],
  customerId: string
): Promise<Map<string, HistoryPrice>> {
  try {
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
          lt: new Date()  // 查找在当前时间之前的记录
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
    const historyPrices = new Map<string, HistoryPrice>()
    const processedProductIds = new Set<string>()

    // 由于记录已经按shippedAt降序排序，第一次遇到的记录就是最新的
    for (const record of historyRecords) {
      if (!processedProductIds.has(record.productId)) {
        // 调整日期格式：将时间转换为北京时间午夜时分
        const shippedDate = record.shippedAt ? convertToBeijingMidnight(record.shippedAt) : null

        const historyPrice: HistoryPrice = {
          price: record.priceRMB,
          date: shippedDate,
          status: 'SHIPPED',
          customerId
        }
        historyPrices.set(record.productId, historyPrice)
        processedProductIds.add(record.productId)
      }
    }

    // 为没有找到历史记录的产品设置空值
    for (const productId of productIds) {
      if (!historyPrices.has(productId)) {
        historyPrices.set(productId, {
          price: null,
          date: null,
          status: null,
          customerId
        })
      }
    }

    return historyPrices
  } catch (error) {
    console.error('获取历史价格失败:', error)
    return new Map()
  }
}