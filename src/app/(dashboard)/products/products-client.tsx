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

export function ProductsClient({ products }: ProductsClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [previewData, setPreviewData] = useState<{
    success: Partial<Product>[]
    errors: { row: number; error: string }[]
  } | null>(null)

  // 处理导出
  const handleExport = () => {
    try {
      exportToExcel(products)
      toast.success('导出成功')
    } catch (error) {
      toast.error('导出失败')
    }
  }

  // 处理导入
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      // 1. 解析 Excel 文件
      console.log('开始解析文件:', file.name)
      const result = await importFromExcel(file)
      
      // 检查是否有错误
      if (result.errors.length > 0) {
        const errorMessage = result.errors
          .map(e => `第 ${e.row} 行: ${e.error}`)
          .join('\n')
        toast.error('导入出现错误：\n' + errorMessage)
        return
      }

      setPreviewData(result)
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
  const handleConfirmImport = async () => {
    if (!previewData?.success.length) return

    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(previewData.success)
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '保存数据失败')
      }

      if (!result.success) {
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
    }
  }

  return (
    <ColumnVisibilityProvider>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">商品管理</h1>
          
          <div className="flex items-center gap-2">
            <ColumnVisibility />
            
            {/* 批量操作按钮 */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  导入
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>导入商品数据</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">导入说明：</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>请使用Excel格式文件（.xlsx或.xls）</li>
                      <li>文件大小不超过10MB</li>
                      <li>商品编号、商品描述、成本为必填项</li>
                      <li>成本请填写数字，最多保留2位小数</li>
                      <li>装箱重量请填写数字，单位为kg</li>
                      <li>MOQ请填写整数</li>
                      <li>图片支持URL链接或Base64格式</li>
                      <li>图片将自动压缩至200px，文件大小不超过100KB</li>
                    </ul>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          await generateTemplate()
                        } catch (error) {
                          toast.error('下载模板失败')
                        }
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下载模板
                    </Button>
                    
                    <div>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleImport}
                      />
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        {isImporting ? '导入中...' : '选择文件并导入'}
                      </Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" className="text-red-500">
              <Trash className="mr-2 h-4 w-4" />
              批量删除
            </Button>
            
            <Link href="/products/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                添加商品
              </Button>
            </Link>
          </div>
        </div>
        
        <ProductsTable products={products} />
        
        {previewData && (
          <ImportPreviewDialog
            isOpen={!!previewData}
            onClose={() => setPreviewData(null)}
            onConfirm={handleConfirmImport}
            previewData={previewData}
          />
        )}
      </div>
    </ColumnVisibilityProvider>
  )
} 