"use client"

import { useState, useContext, useRef } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Product } from "@prisma/client"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Download, Upload, Settings, Loader2, Trash2 } from "lucide-react"
import { ColumnVisibility, ColumnVisibilityProvider, ColumnVisibilityContext } from "./column-visibility"
import { toast } from "sonner"
import { ImportDialog } from "@/app/(dashboard)/products/components/import-dialog"
import { useRouter } from "next/navigation"

console.log('ImportDialog imported:', ImportDialog)

interface ProductsClientProps {
  products: Product[]
}

interface DuplicateProduct {
  barcode: string
  existingProduct: {
    itemNo: string
    description: string
    supplier: string | null
  }
  newProduct: {
    itemNo: string
    description: string
  }
}

export function ProductsClient({ products: initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [visibleColumns, setVisibleColumns] = useState(columns)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // 获取所有供应商（去重并过滤掉 null）
  const suppliers = Array.from(new Set(products.map(p => p.supplier).filter((s): s is string => s !== null)))

  // 过滤商品
  const filteredProducts = selectedSupplier === 'all' 
    ? products 
    : products.filter(p => p.supplier === selectedSupplier)

  console.log('Initial products:', initialProducts)
  console.log('Products state:', products)
  console.log('Filtered products:', filteredProducts)
  console.log('Columns:', columns)
  console.log('DataTable props:', {
    columns,
    data: filteredProducts,
    searchKey: "itemNo"
  })

  const toggleColumns = () => {
    if (visibleColumns.length === columns.length) {
      // 切换到精简视图 - 显示最常用的列
      const basicColumns = columns.filter(col => {
        const key = (col as any).accessorKey
        return [
          'picture',
          'itemNo',
          'description',
          'cost',
          'supplier'
        ].includes(key)
      })
      setVisibleColumns(basicColumns)
    } else {
      // 切换到完整视图
      setVisibleColumns(columns)
    }
  }

  // 修改批量删除处理函数
  const handleBatchDelete = async () => {
    if (selectedRows.length === 0) {
      toast.warning('请先选择要删除的商品')
      return
    }

    // 获取选中商品的信息
    const selectedProducts = products.filter(p => selectedRows.includes(p.id))
    const productInfo = selectedProducts
      .map(p => `${p.itemNo} - ${p.description}`)
      .join('\n')

    if (!confirm(`确定要删除以下 ${selectedRows.length} 个商品吗？此操作不可恢复！\n\n${productInfo}`)) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/products/batch', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedRows })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '删除失败')
      }

      // 更新本地状态
      setProducts(prevProducts => 
        prevProducts.filter(product => !selectedRows.includes(product.id))
      )
      
      toast.success(`成功删除 ${result.count} 个商品`)
      setSelectedRows([])
      
      // 仍然调用 router.refresh() 以确保其他组件也得到更新
      router.refresh()
    } catch (error) {
      console.error('删除失败:', error)
      toast.error(error instanceof Error ? error.message : '删除失败')
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const response = await fetch('/api/products/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ids: selectedRows.length > 0 ? selectedRows : undefined 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '导出失败')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `商品列表_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('导出成功')
    } catch (error) {
      console.error('导出错误:', error)
      toast.error(error instanceof Error ? error.message : '导出失败')
    }
  }

  // 处理导入
  const handleImport = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        if (response.status === 409) {
          // 显示重复商品的详细信息
          const duplicateInfo = error.duplicates.map((d: DuplicateProduct) => 
            `条形码: ${d.barcode}\n` +
            `现有商品: ${d.existingProduct.itemNo} - ${d.existingProduct.description}\n` +
            `新商品: ${d.newProduct.itemNo} - ${d.newProduct.description}\n`
          ).join('\n')

          if (confirm(
            `发现${error.duplicateCount}个重复的条形码:\n\n${duplicateInfo}\n\n是否更新这些商品？`
          )) {
            // 重新提交，允许更新
            formData.append('updateDuplicates', 'true')
            const updateResponse = await fetch('/api/products/import', {
              method: 'POST',
              body: formData
            })
            if (!updateResponse.ok) throw new Error('导入失败')
            const result = await updateResponse.json()
            toast.success(`成功更新${result.updated}个商品，新增${result.created}个商品`)
          }
          return
        }
        throw new Error(error.error || '导入失败')
      }

      const result = await response.json()
      toast.success(`成功导入${result.created}个商品`)
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '导入失败')
    }
  }

  console.log('importDialogOpen state:', importDialogOpen)

  console.log('Rendering ProductsClient, importDialogOpen:', importDialogOpen)

  return (
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            {selectedRows.length > 0 ? `导出选中(${selectedRows.length})` : '导出全部'}
          </Button>
          <div className="relative">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />导入
            </Button>
          </div>
          <Button variant="outline" onClick={toggleColumns}>
            <Settings className="mr-2 h-4 w-4" />
            {visibleColumns.length === columns.length ? '精简视图' : '完整视图'}
          </Button>

          {selectedRows.length > 0 && (
            <Button 
              variant="destructive" 
              onClick={handleBatchDelete}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除选中 ({selectedRows.length})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <ImportDialog 
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImport}
      />

      <DataTable 
        columns={visibleColumns}
        data={filteredProducts}
        searchKey="itemNo"
        onSelectedRowsChange={(rows) => {
          setSelectedRows(rows.map(row => row.id))
        }}
      />
    </div>
  )
} 