import { prisma } from "@/lib/db"
import { EditQuotationForm } from "./edit-quotation-form"
import { notFound } from "next/navigation"
import { getProductsHistoryPricesServer } from "@/lib/services/server/price-history"
import { QuotationItem } from "@/types/quotation"
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { id: string }
}

export default async function EditQuotationPage({ params }: PageProps) {
  // 禁用缓存，确保每次访问都获取最新数据
  noStore()
  
  try {
    console.log('Server: 编辑页面 - 开始加载报价单数据', params.id)
    
    const quotation = await prisma.quotation.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        }
      }
    })

    if (!quotation) {
      console.log('Server: 编辑页面 - 报价单不存在', params.id)
      notFound()
    }

    console.log('Server: 编辑页面 - 成功加载报价单数据', {
      id: quotation.id,
      items: quotation.items.length
    })

    // 获取历史价格数据
    const productIds = quotation.items.map(item => item.productId)
    const historyPrices = await getProductsHistoryPricesServer(productIds, quotation.customer.id)

    console.log('Server: 编辑页面 - 成功获取历史价格数据', {
      productIds: productIds.length,
      historyPrices: historyPrices.size
    })

    // 转换数据格式，以符合 EditQuotationForm 组件的要求
    const itemsWithHistory: QuotationItem[] = quotation.items.map(item => {
      const historyPrice = historyPrices.get(item.productId) || {
        price: null,
        date: null,
        status: null,
        customerId: quotation.customer.id
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
          picture: item.product.images?.[0]?.url || null,
          barcode: item.product.barcode || '',
          category: item.product.category,
          images: Array.isArray(item.product.images) ? item.product.images : []
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
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">编辑报价单</h1>
        <EditQuotationForm 
          quotation={quotationWithHistory}
        />
      </div>
    )
  } catch (error) {
    console.error('加载报价单失败:', error)
    notFound()
  }
} 