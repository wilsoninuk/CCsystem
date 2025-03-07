import { prisma } from "@/lib/db"
import { NewQuotationFormWrapper } from "./new-quotation-form-wrapper"

export default async function NewQuotationPage() {
  // 获取所有客户信息
  const customers = await prisma.customer.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      piAddress: true,
      piShipper: true,
      paymentMethod: true,
      shippingMethod: true,
      currency: true,
      exchangeRate: true,
    },
    orderBy: { code: 'asc' }
  })

  return <NewQuotationFormWrapper customers={customers} />
} 