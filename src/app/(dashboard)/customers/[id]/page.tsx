import { prisma } from "@/lib/db"
import { CustomerDetail } from "./customer-detail"
import { notFound } from "next/navigation"

export default async function CustomerPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      quotations: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!customer) {
    notFound()
  }

  return <CustomerDetail customer={customer} />
} 