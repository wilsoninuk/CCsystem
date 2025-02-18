import { prisma } from "@/lib/db"
import { QuotationDetail } from "./quotation-detail"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StatusActions } from "./status-actions"

interface PageProps {
  params: { id: string }
}

export default async function QuotationPage(props: PageProps) {
  const { id } = await Promise.resolve(props.params)
  
  const quotation = await prisma.quotation.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: {
            select: {
              itemNo: true,
              description: true,
              picture: true,
              material: true,
              color: true,
              productSize: true,
              cartonSize: true,
              moq: true,
            }
          }
        }
      }
    }
  })

  if (!quotation) {
    notFound()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">报价单详情</h1>
          <div className="text-sm text-muted-foreground">
            {quotation.number}
          </div>
          <Badge variant={quotation.status === 'official' ? 'default' : 'secondary'}>
            {quotation.status === 'official' ? '正式' : '草稿'}
          </Badge>
        </div>
        <StatusActions id={id} status={quotation.status} />
      </div>
      <QuotationDetail quotation={quotation} />
    </div>
  )
} 