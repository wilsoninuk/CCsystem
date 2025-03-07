import { prisma } from "@/lib/db"
import { QuotesClient } from "./quotes-client"

export default async function ProductQuotesPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  const quotes = await prisma.quotationItem.findMany({
    where: { productId: id },
    include: {
      quotation: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { 
      quotation: {
        updatedAt: 'desc'
      }
    }
  })

  // 转换数据格式以适应组件需求
  const formattedQuotes = quotes.map(item => ({
    id: item.id,
    quotationId: item.quotationId,
    quotationNumber: item.quotation.number,
    customerId: item.quotation.customerId,
    customer: item.quotation.customer,
    quantity: item.quantity,
    priceRMB: item.exwPriceRMB,
    priceUSD: item.exwPriceUSD,
    updatedAt: item.quotation.updatedAt
  }))

  return <QuotesClient quotes={formattedQuotes} />
} 