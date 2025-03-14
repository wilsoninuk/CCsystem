"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, Eye, FileText, Plus, Trash, RefreshCw } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { toast } from "sonner"
import type { Quotation, Customer } from "@prisma/client"

type QuotationType = Quotation & {
  customer: Pick<Customer, "name" | "code">
}

export function QuotationList({ quotations: initialQuotations }: { quotations: QuotationType[] }) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState("")
  const [quotationToDelete, setQuotationToDelete] = useState<string | null>(null)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [quotations, setQuotations] = useState<QuotationType[]>(initialQuotations)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 刷新数据的函数
  const refreshData = useCallback(async () => {
    try {
      setIsRefreshing(true)
      const response = await fetch('/api/quotations/list', {
        // 添加缓存控制头，确保获取最新数据
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (!response.ok) {
        throw new Error('获取报价单列表失败')
      }
      const data = await response.json()
      setQuotations(data)
      
      // 同时刷新路由，确保服务器组件也获取最新数据
      router.refresh()
    } catch (error) {
      console.error('刷新数据失败:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [router])

  // 定期自动刷新数据（每60秒）
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData()
    }, 60000)

    return () => clearInterval(intervalId)
  }, [refreshData])

  const handleDelete = async (id: string) => {
    setQuotationToDelete(id)
    setIsDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!quotationToDelete) return

    try {
      const response = await fetch(`/api/quotations/${quotationToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: deletePassword })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || '删除失败')
      }

      toast.success('报价单已删除')
      
      // 删除成功后立即刷新数据
      refreshData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsDeleteDialogOpen(false)
      setDeletePassword("")
      setQuotationToDelete(null)
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
          <Button 
            variant="outline" 
            onClick={refreshData} 
            disabled={isRefreshing}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? '刷新中...' : '刷新'}
          </Button>
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
        meta={{
          onRowSelectionChange: (rows: any[]) => {
            setSelectedRows(rows.map((row: any) => row.id))
          }
        }}
      />

      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open)
          if (!open) {
            setDeletePassword("")
            setQuotationToDelete(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除确认</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">请输入删除密码以确认删除操作</p>
            <Input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="请输入密码"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  confirmDelete()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setDeletePassword("")
                setQuotationToDelete(null)
              }}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={!deletePassword}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}