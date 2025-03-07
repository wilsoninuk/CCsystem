"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { Customer } from "@prisma/client"

interface CustomerListProps {
  customers: Customer[]
}

const columns: ColumnDef<Customer>[] = [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          客户编号
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "name",
    header: "客户名称",
  },
  {
    accessorKey: "paymentMethod",
    header: "付款方式",
  },
  {
    accessorKey: "shippingMethod",
    header: "船运方式",
  },
  {
    accessorKey: "currency",
    header: "默认货币",
  },
  {
    accessorKey: "exchangeRate",
    header: "汇率",
    cell: ({ row }) => row.original.exchangeRate?.toFixed(4) || '-',
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const router = useRouter()
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/customers/${row.original.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  },
]

export function CustomerList({ customers }: CustomerListProps) {
  const router = useRouter()

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">客户管理</h2>
          <p className="text-muted-foreground">
            管理所有客户信息
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/customers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            新建客户
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={customers}
        searchKey="code"
      />
    </div>
  )
} 