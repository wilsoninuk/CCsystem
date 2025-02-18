import { prisma } from "@/lib/db"
import { NewQuoteForm } from "./new-quote-form"

export default async function NewQuotePage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // 获取客户信息
  const customer = await prisma.customer.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      piAddress: true,
      piShipper: true,
      paymentMethod: true,
      shippingMethod: true,
      currency: true,
      exchangeRate: true,
      // 获取该客户的所有商品历史报价
      productPrices: {
        include: {
          product: {
            select: {
              id: true,
              itemNo: true,
              barcode: true,
              description: true,
              picture: true,
              cost: true
            }
          }
        }
      }
    }
  })

  if (!customer) {
    return <div>客户不存在</div>
  }

  return <NewQuoteForm customer={customer} />
} 