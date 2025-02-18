"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, FileText, Plus, Trash } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Quotation, Customer } from "@prisma/client"

type QuotationType = Quotation & {
  customer: Pick<Customer, "name" | "code">
}

export function QuotationList({ quotations }: { quotations: QuotationType[] }) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个报价单吗？')) {
      return
    }

    try {
      const response = await fetch(`/api/quotations/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('删除失败')
      }

      toast.success('报价单已删除')
      router.refresh() // 刷新页面数据
    } catch (error) {
      toast.error('删除失败')
      console.error('删除报价单失败:', error)
    }
  }

  const columns: ColumnDef<QuotationType>[] = [
    {
      accessorKey: "number",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            报价单号
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "customer.name",
      header: "客户名称",
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.original.status
        const statusMap = {
          draft: "草稿",
          sent: "已发送",
          modified: "已修改",
          final: "最终版"
        }
        return statusMap[status as keyof typeof statusMap] || status
      }
    },
    {
      accessorKey: "totalAmountUSD",
      header: "总金额(USD)",
      cell: ({ row }) => `$${row.original.totalAmountUSD.toFixed(2)}`,
    },
    {
      accessorKey: "createdAt",
      header: "创建时间",
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const quotation = row.original
        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/quotations/${quotation.id}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/quotations/${quotation.id}/print`)}
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(quotation.id)}
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">报价单管理</h2>
          <p className="text-muted-foreground">
            管理所有报价单
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => router.push("/quotations/new")}>
            <Plus className="mr-2 h-4 w-4" />
            新建报价单
          </Button>
        </div>
      </div>

      <DataTable 
        columns={columns}
        data={quotations}
        searchKey="number"
      />
    </div>
  )
}