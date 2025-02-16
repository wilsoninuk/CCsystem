import { prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { ColumnVisibility, ColumnVisibilityProvider } from "./column-visibility"
import { ProductsTable } from "./products-table"

export default async function ProductsPage() {
  // 从数据库获取所有商品数据
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <ColumnVisibilityProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">商品管理</h1>
          
          <div className="flex items-center gap-2">
            <ColumnVisibility />
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </Link>
          </div>
        </div>
        
        <ProductsTable products={products} />
      </div>
    </ColumnVisibilityProvider>
  )
} 