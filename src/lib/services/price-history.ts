import { prisma } from "@/lib/prisma"

export type HistoryPriceStatus = 'COMPLETED' | 'SHIPPED' | 'PI_GENERATED' | 'CI_GENERATED'

export interface HistoryPrice {
  price: number | null
  date: Date | null
  status: HistoryPriceStatus | null
  customerId: string
}

interface ShippingRecordItem {
  productId: string
  price: number
  createdAt: Date
}

interface ShippingRecord {
  id: string
  customerId: string
  shippingDate: Date
  status: string
  items: ShippingRecordItem[]
}

/**
 * 获取产品在特定客户历史出货中的最新价格
 */
export async function getProductHistoryPrice(productId: string, customerId: string): Promise<HistoryPrice> {
  try {
    console.log('正在获取产品历史出货价格，产品ID:', productId, '客户ID:', customerId)
    
    const response = await fetch(
      `/api/products/history-prices?productIds=${productId}&customerId=${customerId}`
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch history price')
    }

    const data = await response.json()
    return data[productId] || {
      price: null,
      date: null,
      status: null,
      customerId
    }
  } catch (error) {
    console.error('获取产品历史出货价格失败:', error)
    return {
      price: null,
      date: null,
      status: null,
      customerId
    }
  }
}

/**
 * 客户端获取历史价格
 */
export async function getProductsHistoryPrices(
  productIds: string[],
  customerId: string
): Promise<Map<string, HistoryPrice>> {
  try {
    const response = await fetch('/api/price-history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productIds,
        customerId
      })
    })

    if (!response.ok) {
      throw new Error('获取历史价格失败')
    }

    const data = await response.json()
    const historyPrices = new Map<string, HistoryPrice>()

    // 转换日期字符串为Date对象
    for (const [productId, history] of Object.entries(data)) {
      const historyData = history as any
      historyPrices.set(productId, {
        price: historyData.price,
        date: historyData.date ? new Date(historyData.date) : null,
        status: historyData.status,
        customerId: historyData.customerId
      })
    }

    return historyPrices
  } catch (error) {
    console.error('获取历史价格失败:', error)
    return new Map()
  }
} 