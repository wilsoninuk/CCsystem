"use client"

import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Customer, Quotation, QuotationItem } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, Eye, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface QuotationItemWithProduct extends QuotationItem {
  product: {
    itemNo: string
    barcode: string
    description: string
    picture: string | null
  }
}

interface QuotesTableProps {
  customer: Customer & {
    quotations: (Quotation & {
      items: QuotationItemWithProduct[]
    })[]
  }
}

// 定义表格列
const columns: ColumnDef<QuotationItemWithProduct>[] = [
  {
    accessorKey: "serialNo",
    header: "S.N.",
    size: 60,
  },
  {
    accessorKey: "product.itemNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Item No.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "product.barcode",
    header: "Barcode",
  },
  {
    accessorKey: "product.description",
    header: "Description",
    size: 200,
  },
  {
    id: "picture",
    header: "Picture",
    cell: ({ row }) => {
      const picture = row.original.product.picture
      if (!picture) return null
      
      return (
        <div className="relative w-16 h-16">
          <Image
            src={picture}
            alt={row.original.product.description || ""}
            fill
            className="object-contain"
          />
        </div>
      )
    },
    size: 100,
  },
  {
    accessorKey: "exwPriceRMB",
    header: "EXW Price(RMB)",
    cell: ({ row }) => `¥${row.original.exwPriceRMB.toFixed(2)}`,
  },
  {
    accessorKey: "exwPriceUSD",
    header: "EXW Price(USD)",
    cell: ({ row }) => `$${row.original.exwPriceUSD.toFixed(2)}`,
  },
  {
    accessorKey: "quantity",
    header: "Qty",
    cell: ({ row }) => row.original.quantity.toLocaleString(),
  },
  {
    id: "totalRMB",
    header: "Total Amount(RMB)",
    cell: ({ row }) => {
      const total = row.original.exwPriceRMB * row.original.quantity
      return `¥${total.toFixed(2)}`
    },
  },
  {
    id: "totalUSD",
    header: "Total Amount(USD)",
    cell: ({ row }) => {
      const total = row.original.exwPriceUSD * row.original.quantity
      return `$${total.toFixed(2)}`
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-2">
          <Link href={`/quotations/${row.original.quotationId}/items/${row.original.id}`}>
            <Button variant="ghost" size="sm">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    },
  },
]

export function QuotesTable({ customer }: QuotesTableProps) {
  return (
    <DataTable 
      columns={columns} 
      data={customer.quotations.flatMap(q => q.items)}
      searchKey="product.itemNo"
    />
  )
} 