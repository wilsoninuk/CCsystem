import type { Product, ProductImage } from "@prisma/client"
import { HistoryPrice } from "@/lib/services/price-history"

export interface QuotationItem {
  id: string
  productId: string
  quotationId: string
  barcode: string
  serialNo: number
  quantity: number
  exwPriceRMB: number | null
  exwPriceUSD: number | null
  shipping: number | null
  remark: string | null
  actualQty: number | null
  finalPriceRMB: number | null
  finalPriceUSD: number | null
  profit: number | null
  profitRate: number | null
  createdAt: Date
  updatedAt: Date
  product: {
    id: string
    itemNo: string
    barcode: string
    description: string
    picture: string | null
    cost: number
    category: string | null
    supplier: {
      name: string
    }
    images?: Array<{
      id: string
      url: string
      isMain: boolean
      order: number
    }>
  }
  color?: 'blue' | 'purple' | 'pink' | null
  historyPrice?: HistoryPrice
} 