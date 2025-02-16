import { DataTable } from "@/components/ui/data-table/DataTable"
import { columns } from "./columns"
import { prisma } from "@/lib/db"

export default async function ProductsPage() {
  // 从数据库获取所有商品数据
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">商品管理</h1>
      </div>
      
      <DataTable 
        columns={columns} 
        data={products}
        searchKey="barcode"
      />
    </div>
  )
} 