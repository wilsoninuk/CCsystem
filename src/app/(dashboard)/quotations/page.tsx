import { prisma } from "@/lib/db"
import { QuotationList } from "./quotation-list"

export default async function QuotationsPage() {
  const quotations = await prisma.quotation.findMany({
    include: {
      customer: {
        select: {
          name: true,
          code: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <QuotationList quotations={quotations} />
} 