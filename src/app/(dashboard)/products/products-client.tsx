"use client"

import { useState, useContext } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Product } from "@prisma/client"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Download, Upload } from "lucide-react"
import { ColumnVisibility, ColumnVisibilityProvider, ColumnVisibilityContext } from "./column-visibility"

interface ProductsClientProps {
  products: Product[]
}

export function ProductsClient({ products: initialProducts }: ProductsClientProps) {
  const [products] = useState(initialProducts)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const { selectedColumns } = useContext(ColumnVisibilityContext)

  // 获取所有供应商（去重并过滤掉 null）
  const suppliers = Array.from(new Set(products.map(p => p.supplier).filter((s): s is string => s !== null)))

  // 过滤商品
  const filteredProducts = selectedSupplier === 'all' 
    ? products 
    : products.filter(p => p.supplier === selectedSupplier)

  // 过滤列 - 修复类型错误
  const visibleColumns = columns.filter(col => {
    if ('accessorKey' in col) {
      return selectedColumns.includes(col.accessorKey as string)
    }
    return false
  })

  return (
    <ColumnVisibilityProvider>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">商品管理</h2>
            <p className="text-muted-foreground">
              管理所有商品信息，包括基本信息、图片、价格等
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* 供应商筛选 */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">供应商:</span>
              <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  {suppliers.map(supplier => (
                    <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 工具按钮 */}
            <Button>
              <Plus className="mr-2 h-4 w-4" />新增
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />导出
            </Button>
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />导入
            </Button>
            <ColumnVisibility />
          </div>
        </div>

        <DataTable 
          columns={visibleColumns}
          data={filteredProducts}
          searchKey="itemNo"
          onSelectedRowsChange={(rows) => {
            setSelectedRows(rows.map(row => row.itemNo))
          }}
        />
      </div>
    </ColumnVisibilityProvider>
  )
} 