import { prisma } from "@/lib/db"
import { EditQuotationForm } from "./edit-quotation-form"
import { notFound } from "next/navigation"

interface PageProps {
  params: { id: string }
}

export default async function EditQuotationPage(props: PageProps) {
  const { id } = await Promise.resolve(props.params)
  
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
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

  if (!quotation) {
    notFound()
  }

  return <EditQuotationForm quotation={quotation} />
} 