import { prisma } from "@/lib/db"
import { QuotesClient } from "./quotes-client"

export default async function ProductQuotesPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  const quotes = await prisma.productQuote.findMany({
    where: { productId: id },
    include: {
      customer: true
    },
    orderBy: { updatedAt: 'desc' }
  })

  return <QuotesClient quotes={quotes} />
} 