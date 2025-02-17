"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"  // 使用 Prisma 生成的类型
import { Button } from "@/components/ui/button"
import { Edit, Trash, ChevronDown, ChevronRight, ArrowUpDown, Upload } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ProductImage } from "@/components/ui/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { toast } from "sonner"

// 只使用自定义的 TableMeta 类型定义
type TableMeta<TData> = {
  updateData: (rowIndex: number, updatedProduct: TData) => void
}

// 基础列 - 始终显示
export const baseColumns: ColumnDef<Product>[] = [
  // 选择列
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  // 商品编号列
  {
    accessorKey: "itemNo",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          商品编号
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {row.getValue("itemNo")}
        </div>
      )
    },
  },
  {
    accessorKey: "picture",
    header: "商品图片",
    cell: ({ row }) => {
      return (
        <div className="relative w-20 h-20">
          <ProductImage
            src={row.original.picture}
            alt={row.original.description || "商品图片"}
          />
        </div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "商品描述",
  },
  {
    accessorKey: "cost",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          成本
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const cost = parseFloat(row.getValue("cost"))
      return `¥${cost.toFixed(2)}`
    },
  },
]

// 可选列 - 可以切换显示/隐藏
export const optionalColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "barcode",
    header: "条形码",
  },
  {
    accessorKey: "color",
    header: "颜色/款式",
  },
  {
    accessorKey: "material",
    header: "材料",
  },
  {
    accessorKey: "productSize",
    header: "产品尺寸",
  },
  {
    accessorKey: "cartonSize",
    header: "装箱尺寸",
  },
  {
    accessorKey: "cartonWeight",
    header: "装箱重量",
    cell: ({ row }) => {
      const weight = row.getValue("cartonWeight") as number
      return weight ? `${weight}kg` : '-'
    }
  },
  {
    accessorKey: "moq",
    header: "MOQ",
  },
  {
    accessorKey: "supplier",
    header: "供应商",
  },
  {
    accessorKey: "link1688",
    header: "1688链接",
    cell: ({ row }) => {
      const link = row.getValue("link1688") as string
      return link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          查看
        </a>
      ) : null
    }
  },
]

// 操作列
export const actionColumn: ColumnDef<Product> = {
  id: "actions",
  header: "操作",
  cell: ({ row, table }) => {
    const product = row.original
    const [isUploading, setIsUploading] = useState(false)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(product.picture)
    const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null)
    const [isOpen, setIsOpen] = useState(false)

    // 处理文件选择和预览
    const handleFileSelect = (file: File) => {
      setSelectedFile(file)
      const localUrl = URL.createObjectURL(file)
      setLocalPreviewUrl(localUrl)
    }

    // 处理图片上传
    const handleUpload = async () => {
      if (!selectedFile) return

      try {
        setIsUploading(true)
        const formData = new FormData()
        formData.append('file', selectedFile)
        formData.append('itemNo', product.itemNo)

        const response = await fetch('/api/products/upload-image', {
          method: 'POST',
          body: formData,
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || '上传失败')
        }

        // 更新表格数据
        const updatedProduct = { ...product, picture: data.url }
        ;(table.options.meta as TableMeta<Product>).updateData(row.index, updatedProduct)
        setPreviewUrl(data.url)
        toast.success('上传成功')
        setIsOpen(false) // 关闭对话框

      } catch (error) {
        console.error('Upload error:', error)
        setPreviewUrl(product.picture) // 恢复原图片
        toast.error(error instanceof Error ? error.message : '上传失败，请重试')
      } finally {
        setIsUploading(false)
        // 清理本地预览URL和选中的文件
        if (localPreviewUrl) {
          URL.revokeObjectURL(localPreviewUrl)
          setLocalPreviewUrl(null)
        }
        setSelectedFile(null)
      }
    }

    // 处理对话框关闭
    const handleDialogClose = () => {
      setIsOpen(false)
      // 清理预览
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl)
        setLocalPreviewUrl(null)
      }
      setSelectedFile(null)
    }

    // 添加删除处理函数
    const handleDelete = async () => {
      if (!confirm(`确定要删除商品 "${product.itemNo}" 吗？此操作不可恢复！`)) {
        return
      }

      try {
        const response = await fetch('/api/products/batch', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            itemNos: [product.itemNo]
          })
        })

        const result = await response.json()
        
        if (result.success) {
          // 使用 window.location.reload() 刷新页面
          // 这样可以避免状态管理的复杂性
          window.location.reload()
          toast.success('删除成功')
        } else {
          toast.error(result.error || '删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)
        toast.error('删除失败，请重试')
      }
    }

    return (
      <div className="flex items-center gap-2">
        <Link href={`/products/${product.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上传商品图片</DialogTitle>
              <DialogDescription>
                请选择要上传的商品图片，预览确认后点击上传
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* 上传规则说明 */}
              <div className="text-sm text-muted-foreground space-y-1">
                <h3 className="font-medium text-foreground">上传要求：</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>支持 JPG、PNG、GIF、WebP 格式</li>
                  <li>文件大小不超过 5MB</li>
                  <li>图片将自动调整为最大 800×800 像素</li>
                  <li>建议使用清晰的产品实拍图</li>
                </ul>
              </div>

              {/* 预览区域 */}
              <div className="w-40 h-40 mx-auto">
                <ProductImage 
                  src={localPreviewUrl || previewUrl}
                  alt={product.description || "商品图片"}
                />
              </div>

              {/* 按钮区域 */}
              <div className="flex justify-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id={`upload-${product.id}`}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
                <Button
                  variant="outline"
                  onClick={() => {
                    document.getElementById(`upload-${product.id}`)?.click()
                  }}
                >
                  选择图片
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                >
                  {isUploading ? '上传中...' : '确认上传'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={handleDelete}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    )
  }
}

// 主要列
export const columns: ColumnDef<Product>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      const [isExpanded, setIsExpanded] = useState(false)
      
      return (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            row.toggleExpanded()
            setIsExpanded(!isExpanded)
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      )
    },
  },
  ...baseColumns,
  ...optionalColumns,
  actionColumn
]

// 获取可见列
export function getVisibleColumns(selectedColumns: string[]) {
  return [
    columns[0], // expander
    ...baseColumns, // 基础列（包括 itemNo）
    ...optionalColumns.filter(col => {
      const column = col as { accessorKey?: string }
      return column.accessorKey && selectedColumns.includes(column.accessorKey)
    }),
    actionColumn
  ]
}

// 修改展开后的详细信息组件
export const renderSubComponent = ({ row }: { row: any }) => {
  const product = row.original
  
  return (
    <div className="p-4 bg-gray-50 rounded-md space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-medium text-gray-900">基本信息</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">条形码：</span>
              <span>{product.barcode}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">颜色/款式：</span>
              <span>{product.color || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">材料：</span>
              <span>{product.material || '-'}</span>
            </div>
          </div>
        </div>
        
        {/* 规格信息 */}
        <div>
          <h3 className="font-medium text-gray-900">规格信息</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">产品尺寸：</span>
              <span>{product.productSize || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">装箱尺寸：</span>
              <span>{product.cartonSize || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">装箱重量：</span>
              <span>{product.cartonWeight ? `${product.cartonWeight}kg` : '-'}</span>
            </div>
          </div>
        </div>
        
        {/* 供应商信息 */}
        <div>
          <h3 className="font-medium text-gray-900">供应商信息</h3>
          <div className="mt-2 space-y-2">
            <div>
              <span className="text-sm text-gray-500">供应商：</span>
              <span>{product.supplier || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">MOQ：</span>
              <span>{product.moq || '-'}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">1688链接：</span>
              {product.link1688 ? (
                <a 
                  href={product.link1688}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  查看
                </a>
              ) : '-'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 导出可选列配置供其他组件使用
export const OPTIONAL_COLUMNS = [
  { key: "barcode", label: "条形码" },
  { key: "color", label: "颜色/款式" },
  { key: "material", label: "材料" },
  { key: "productSize", label: "产品尺寸" },
  { key: "cartonSize", label: "装箱尺寸" },
  { key: "cartonWeight", label: "装箱重量" },
  { key: "moq", label: "MOQ" },
  { key: "supplier", label: "供应商" },
  { key: "link1688", label: "1688链接" },
] as const; 