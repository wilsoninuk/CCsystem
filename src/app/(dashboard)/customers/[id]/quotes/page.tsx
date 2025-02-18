import { prisma } from "@/lib/db"
import { QuotesClient } from "./quotes-client"

export default async function CustomerQuotesPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // 获取客户信息和报价历史，包含商品基础信息
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      quotations: {
        include: {
          items: {
            include: {
              product: {
                select: {
                  itemNo: true,
                  barcode: true,
                  description: true,
                  picture: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!customer) {
    return <div>客户不存在</div>
  }

  return <QuotesClient customer={customer} />
} 