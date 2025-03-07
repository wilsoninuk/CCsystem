import { prisma } from "@/lib/db"
import { EditQuotationForm } from "./edit-quotation-form"
import { notFound } from "next/navigation"
import { getProductsHistoryPricesServer } from "@/lib/services/server/price-history"
import { QuotationItem } from "@/types/quotation"

interface PageProps {
  params: { id: string }
}

export default async function EditQuotationPage({ params }: { params: { id: string } }) {
  const quotation = await prisma.quotation.findUnique({
    where: { id: params.id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            include: {
              images: {
                where: { isMain: true }
              }
            }
          }
        },
        orderBy: {
          serialNo: 'asc'
        }
      }
    }
  })

  if (!quotation) {
    notFound()
  }

  console.log('获取到的报价单数据:', {
    id: quotation.id,
    customerId: quotation.customerId,
    itemsCount: quotation.items.length,
    items: quotation.items.map(item => ({
      id: item.id,
      productId: item.productId,
      exwPriceRMB: item.exwPriceRMB
    }))
  })

  // 获取所有产品的历史价格
  const productIds = quotation.items.map(item => item.productId)
  const historyPrices = await getProductsHistoryPricesServer(productIds, quotation.customerId)

  console.log('获取到的历史价格:', Array.from(historyPrices.entries()))

  // 将历史价格添加到报价单项目中
  const itemsWithHistory: QuotationItem[] = quotation.items.map(item => {
    const historyPrice = historyPrices.get(item.productId) || {
      price: null,
      date: null,
      status: null,
      customerId: quotation.customerId
    }
    
    return {
      id: item.id,
      quotationId: quotation.id,
      productId: item.productId,
      product: {
        id: item.product.id,
        itemNo: item.product.itemNo,
        description: item.product.description,
        cost: item.product.cost,
        supplier: {
          name: item.product.supplier || ''
        },
        picture: item.product.images[0]?.url || null,
        barcode: item.product.barcode || ''
      },
      barcode: item.barcode,
      quantity: item.quantity,
      actualQty: item.actualQty || 0,
      exwPriceRMB: item.exwPriceRMB,
      exwPriceUSD: item.exwPriceUSD,
      finalPriceRMB: item.finalPriceRMB || item.exwPriceRMB,
      finalPriceUSD: item.finalPriceUSD || item.exwPriceUSD,
      shipping: item.shipping,
      remark: item.remark,
      color: item.color as "blue" | "purple" | "pink" | null,
      serialNo: item.serialNo,
      profit: item.profit || 0,
      profitRate: item.profitRate || 0,
      createdAt: item.createdAt || new Date(),
      updatedAt: item.updatedAt || new Date(),
      historyPrice
    }
  })

  const quotationWithHistory = {
    ...quotation,
    items: itemsWithHistory
  }

  return (
    <EditQuotationForm 
      quotation={quotationWithHistory}
    />
  )
} 