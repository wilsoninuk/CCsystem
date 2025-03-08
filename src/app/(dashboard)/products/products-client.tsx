"use client"

import { useState, useContext, useRef, useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { Product, User, ProductImage } from "@prisma/client"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Plus, Download, Upload, Settings, Loader2, Trash2 } from "lucide-react"
import { ColumnVisibility, ColumnVisibilityProvider, ColumnVisibilityContext } from "./column-visibility"
import { toast } from "sonner"
import { ImportDialog } from "@/app/(dashboard)/products/components/import-dialog"
import { useRouter } from "next/navigation"
import { CreateProductDialog } from "./components/create-product-dialog"
import { ColumnSelectDialog } from "./components/column-select-dialog"

console.log('ImportDialog imported:', ImportDialog)

// 添加带关联的Product类型
type ProductWithRelations = Product & {
  images: ProductImage[]
  creator: User | null
  updater: User | null
}

interface ProductsClientProps {
  products: ProductWithRelations[]
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
  const router = useRouter()
  const [products, setProducts] = useState<ProductWithRelations[]>(initialProducts)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])
  const [visibleColumns, setVisibleColumns] = useState(columns)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [columnSelectOpen, setColumnSelectOpen] = useState(false)

  // 获取所有供应商（去重并过滤掉 null）
  const suppliers = Array.from(new Set(products.map(p => p.supplier).filter((s): s is string => s !== null)))

  // 获取所有类别
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        // 过滤掉空值和"无类别"
        const validCategories = data.filter((category: string | null) => 
          category && category !== "无类别"
        );
        setCategories(validCategories);
      } catch (error) {
        console.error('获取类别失败:', error);
      }
    };

    fetchCategories();
  }, []);

  // 初始化时设置默认可见列
  useEffect(() => {
    const defaultVisibleColumns = columns.filter(column => {
      const key = (column as any).accessorKey || (column as any).id
      return key && !['createdBy', 'createdAt'].includes(key)
    })
    setVisibleColumns(defaultVisibleColumns)
  }, [])

  // 过滤商品
  const filteredProducts = products
    .filter(product => {
      const matchesSupplier = selectedSupplier === 'all' || 
                          (selectedSupplier === '无供应商' ? product.supplier === null : product.supplier === selectedSupplier);
      const matchesCategory = selectedCategory === 'all' || 
                          (selectedCategory === '无类别' ? product.category === null : product.category === selectedCategory);
      return matchesSupplier && matchesCategory;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()); // 按修改时间降序排序

  console.log('Initial products:', initialProducts)
  console.log('Products state:', products)
  console.log('Filtered products:', filteredProducts)
  console.log('Columns:', columns)
  console.log('DataTable props:', {
    columns,
    data: filteredProducts,
    searchKey: "itemNo"
  })

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
        method: 'GET'
      })

      if (!response.ok) {
        throw new Error('导出失败')
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
      console.error('导出失败:', error)
      toast.error('导出失败')
    }
  }

  // 处理导入
  const handleImport = async (file: File) => {
    try {
      // 检查文件大小（10MB限制）
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('文件大小不能超过10MB')
      }

      // 检查文件类型
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        throw new Error('只支持.xlsx或.xls格式的Excel文件')
      }

      console.log('开始导入文件:', {
        name: file.name,
        size: file.size,
        type: file.type
      })

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/products/import', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()
      console.log('导入响应:', result)

      if (!response.ok) {
        if (response.status === 409) {
          // 显示重复商品的详细信息
          const duplicateInfo = result.duplicates.map((d: DuplicateProduct) => 
            `条形码: ${d.barcode}\n` +
            `现有商品: ${d.existingProduct.itemNo} - ${d.existingProduct.description}\n` +
            `新商品: ${d.newProduct.itemNo} - ${d.newProduct.description}\n`
          ).join('\n')

          if (confirm(
            `发现${result.duplicateCount}个重复的条形码:\n\n${duplicateInfo}\n\n是否更新这些商品？`
          )) {
            console.log('用户确认更新重复商品')
            // 重新提交，允许更新
            formData.append('updateDuplicates', 'true')
            const updateResponse = await fetch('/api/products/import', {
              method: 'POST',
              body: formData
            })

            const updateResult = await updateResponse.json()
            console.log('更新响应:', updateResult)

            if (!updateResponse.ok) {
              console.error('更新失败:', updateResult)
              throw new Error(updateResult.error || '更新失败')
            }

            toast.success(`成功更新${updateResult.updated}个商品，新增${updateResult.created}个商品`)
            await refreshProducts()
            return
          }
          return
        }

        console.error('导入失败:', result)
        
        // 显示详细的错误信息
        if (result.details && Array.isArray(result.details)) {
          const errorDetails = result.details
            .map((error: any) => `第 ${error.row} 行: ${error.error}`)
            .join('\n')
          throw new Error(`导入失败:\n${errorDetails}`)
        }
        
        throw new Error(result.error || '导入失败')
      }

      toast.success(`成功导入${result.created}个商品`)
      await refreshProducts()
    } catch (error) {
      console.error('导入错误:', error)
      toast.error(error instanceof Error ? error.message : '导入失败')
      throw error // 重新抛出错误，让ImportDialog组件知道导入失败
    }
  }

  // 刷新商品列表
  const refreshProducts = async () => {
    try {
      const response = await fetch('/api/products?include=images,creator,updater')
      if (!response.ok) throw new Error('获取商品列表失败')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('刷新商品列表失败:', error)
      toast.error('刷新商品列表失败')
    }
  }

  // 添加商品上下线处理函数
  const handleToggleActive = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/products/${productId}/toggle-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新状态失败')
      }

      // 更新本地状态
      setProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, isActive: !currentStatus }
            : product
        )
      )

      toast.success(`商品已${!currentStatus ? '上线' : '下线'}`)
      router.refresh()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error(error instanceof Error ? error.message : '更新状态失败')
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
                <SelectItem value="无供应商">无供应商</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 类别筛选 */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">类别:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="无类别">无类别</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 工具按钮 */}
          <Button onClick={() => setCreateDialogOpen(true)}>
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
          <Button variant="outline" onClick={() => setColumnSelectOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            自定义列
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

      <CreateProductDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          refreshProducts()
          router.refresh()
        }}
      />

      <ColumnSelectDialog 
        open={columnSelectOpen}
        onOpenChange={setColumnSelectOpen}
        columns={columns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
      />

      <DataTable 
        columns={visibleColumns}
        data={filteredProducts}
        searchKey="itemNo"
        onSelectedRowsChange={(rows) => {
          setSelectedRows(rows.map(row => row.id))
        }}
        onToggleActive={handleToggleActive}
      />
    </div>
  )
} 