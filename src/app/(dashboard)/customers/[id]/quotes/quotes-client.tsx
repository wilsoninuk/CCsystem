"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { QuotesTable } from "./quotes-table"
import type { Customer, Quotation, QuotationItem } from "@prisma/client"

interface QuotesClientProps {
  customer: Customer & {
    quotations: (Quotation & {
      items: QuotationItem[]
    })[]
  }
}

export function QuotesClient({ customer }: QuotesClientProps) {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">报价管理</h2>
          <p className="text-muted-foreground">
            {customer.name} 的报价历史记录
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href={`/customers/${customer.id}/quotes/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新建报价单
            </Button>
          </Link>
        </div>
      </div>

      <QuotesTable customer={customer} />
    </div>
  )
} 