import { DataTable } from "@/components/ui/data-table/DataTable"
import { columns } from "./products/columns"
import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Users, FileText } from "lucide-react"

export default async function Home() {
  // 获取统计数据
  const [productsCount, customersCount, quotationsCount] = await Promise.all([
    prisma.product.count(),
    prisma.customer.count(),
    prisma.quotation.count(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">系统概览</h1>
      
      <div className="grid gap-6 md:grid-cols-3 px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">商品总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productsCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">客户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customersCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">报价单总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quotationsCount}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 