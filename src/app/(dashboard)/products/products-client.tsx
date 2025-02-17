"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Trash, Download, Upload } from "lucide-react"
import Link from "next/link"
import { ColumnVisibility, ColumnVisibilityProvider } from "./column-visibility"
import { ProductsTable } from "./products-table"
import { exportToExcel, importFromExcel, generateTemplate } from "@/lib/excel"
import { toast } from "sonner"
import { Product } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ImportPreviewDialog } from "./import-preview-dialog"

interface ProductsClientProps {
  products: Product[]
}

export function ProductsClient({ products: initialProducts }: ProductsClientProps) {
  const [products, setProducts] = useState(initialProducts)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<{
    success: Partial<Product>[]
    duplicates: {
      product: Partial<Product>
      existingProduct: Product
      reason: 'itemNo' | 'barcode'
    }[]
    errors: { row: number; error: string }[]
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts(prev => 
      prev.map(p => 
        p.itemNo === updatedProduct.itemNo ? updatedProduct : p
      )
    )
  }

  // 处理导出
  const handleExport = () => {
    try {
      if (selectedRows.length > 0) {
        // 使用 itemNo 而不是 id 来筛选商品
        const selectedProducts = products.filter(p => selectedRows.includes(p.itemNo))
        if (selectedProducts.length === 0) {
          toast.error('未找到选中的商品')
          return
        }
        exportToExcel(selectedProducts)
        toast.success(`成功导出 ${selectedProducts.length} 个商品`)
      } else {
        if (confirm('是否导出全部商品？')) {
          exportToExcel(products)
          toast.success(`成功导出 ${products.length} 个商品`)
        }
      }
    } catch (error) {
      console.error('导出失败:', error)
      toast.error('导出失败')
    }
  }

  // 处理导入
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const result = await importFromExcel(file)
      
      if (result.errors.length > 0) {
        const errorMessage = result.errors
          .map(e => `第 ${e.row} 行: ${e.error}`)
          .join('\n')
        toast.error('导入出现错误：\n' + errorMessage)
        return
      }

      setPreviewData(result)
      setIsPreviewOpen(true)
    } catch (error) {
      console.error('导入错误:', error)
      toast.error('导入失败：' + (error as Error).message)
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // 确认导入
  const handleConfirmImport = async (includeDuplicates: boolean) => {
    if (!previewData) return

    try {
      const productsToImport = includeDuplicates 
        ? [...previewData.success, ...previewData.duplicates.map(d => d.product)]
        : previewData.success

      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: productsToImport,
          updateDuplicates: includeDuplicates
        })
      })

      const result = await response.json()
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || '保存数据失败')
      }

      toast.success(
        `导入完成：新增 ${result.created} 条，更新 ${result.updated} 条`
      )
      window.location.reload()
    } catch (error) {
      console.error('保存错误:', error)
      toast.error('保存失败：' + (error as Error).message)
    } finally {
      setPreviewData(null)
      setIsPreviewOpen(false)
    }
  }

  // 处理删除
  const handleDelete = async () => {
    if (!selectedRows.length) {
      toast.error('请先选择要删除的商品')
      return
    }
    
    if (!confirm(`确定要删除选中的 ${selectedRows.length} 个商品吗？此操作不可恢复！`)) {
      return
    }

    try {
      const response = await fetch('/api/products/batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemNos: selectedRows
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setProducts(products.filter(p => !selectedRows.includes(p.itemNo)))
        setSelectedRows([])
        toast.success(`成功删除 ${result.count} 个商品`)
      } else {
        toast.error(result.error || '删除失败')
      }
    } catch (error) {
      console.error('删除失败:', error)
      toast.error('删除失败，请重试')
    }
  }

  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <ColumnVisibilityProvider>
        <div className="flex items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">商品管理</h2>
            <p className="text-muted-foreground">
              管理所有商品信息，包括基本信息、图片、价格等
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* 工具栏按钮 */}
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                新增
              </Button>
            </Link>
            
            {selectedRows.length > 0 && (
              <Button variant="destructive" onClick={handleDelete}>
                <Trash className="mr-2 h-4 w-4" />
                删除
              </Button>
            )}

            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  导入
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>导入商品</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* 导入规则说明 */}
                  <div className="text-sm text-muted-foreground space-y-2">
                    <h3 className="font-medium text-foreground">导入说明：</h3>
                    <ul className="list-disc list-inside space-y-1">
                      <li>请先下载模板，按模板格式填写商品信息</li>
                      <li>商品编号、商品描述、成本为必填项</li>
                      <li>成本、装箱重量、MOQ必须为数字</li>
                      <li>如果商品编号已存在，将更新对应商品信息</li>
                      <li>图片需要单独上传，不支持通过Excel导入</li>
                    </ul>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => generateTemplate()}>
                      下载模板
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx"
                      className="hidden"
                      onChange={handleImport}
                      disabled={isImporting}
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      {isImporting ? '导入中...' : '选择文件'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <ColumnVisibility />
          </div>
        </div>

        <ProductsTable 
          products={products}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          onProductUpdate={handleProductUpdate}
        />

        {/* 导入预览对话框 */}
        <ImportPreviewDialog
          data={previewData}
          isOpen={isPreviewOpen}
          onConfirm={handleConfirmImport}
          onCancel={() => {
            setIsPreviewOpen(false)
            setPreviewData(null)
          }}
        />
      </ColumnVisibilityProvider>
    </div>
  )
} 