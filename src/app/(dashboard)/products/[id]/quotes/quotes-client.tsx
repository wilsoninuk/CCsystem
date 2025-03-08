"use client"

import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Customer, ProductQuote } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

interface QuotesClientProps {
  quotes: (ProductQuote & {
    customer: Customer
  })[]
}

const columns: ColumnDef<ProductQuote & { customer: Customer }>[] = [
  {
    accessorKey: "customer.name",
    header: "客户名称",
  },
  {
    accessorKey: "priceRMB",
    header: "人民币价格",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("priceRMB"))
      const formatted = new Intl.NumberFormat("zh-CN", {
        style: "currency",
        currency: "CNY",
      }).format(price)
      return formatted
    },
  },
  {
    accessorKey: "priceUSD",
    header: "美元价格",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("priceUSD"))
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price)
      return formatted
    },
  },
  {
    accessorKey: "updatedAt",
    header: "更新时间",
    cell: ({ row }) => formatDate(row.getValue("updatedAt")),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Link href={`/quotations/${row.original.quotationId}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    },
  },
]

export function QuotesClient({ quotes }: QuotesClientProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">报价历史</h2>
      <DataTable 
        columns={columns} 
        data={quotes}
        searchKey="customer.name"
      />
    </div>
  )
} 