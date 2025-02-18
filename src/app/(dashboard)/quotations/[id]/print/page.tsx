import { prisma } from "@/lib/db"
import { QuotationPrint } from "./quotation-print"
import { notFound } from "next/navigation"

export default async function QuotationPrintPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              itemNo: true,
              description: true,
              material: true,
              color: true,
              productSize: true,
            }
          }
        }
      }
    }
  })

  if (!quotation) {
    notFound()
  }

  return <QuotationPrint quotation={quotation} />
} 