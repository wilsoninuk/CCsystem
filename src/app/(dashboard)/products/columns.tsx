"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Product, User, ProductImage } from "@prisma/client"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "./components/image-upload"
import { useRouter } from "next/navigation"
import { Download, Edit, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { EditProductForm } from "./components/edit-product-form"
import { useState } from "react"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { zhCN } from "date-fns/locale"
import { ProductDetailDialog } from "./components/product-detail-dialog"

// 定义表格元数据类型
interface TableMeta {
  onToggleActive?: (id: string, currentStatus: boolean) => void
}

// 定义可选列配置类型
interface OptionalColumn {
  key: string
  label: string
  required: boolean
  defaultHidden?: boolean
}

// 定义可选列配置
export const OPTIONAL_COLUMNS: OptionalColumn[] = [
  { key: "picture", label: "商品图片", required: true },
  { key: "itemNo", label: "商品编号", required: true },
  { key: "barcode", label: "条形码", required: true },
  { key: "description", label: "商品描述", required: true },
  { key: "category", label: "类别", required: false },
  { key: "cost", label: "成本", required: true },
  { key: "supplier", label: "供应商", required: false },
  { key: "color", label: "颜色/款式", required: false },
  { key: "material", label: "材料", required: false },
  { key: "productSize", label: "产品尺寸", required: false },
  { key: "cartonSize", label: "装箱尺寸", required: false },
  { key: "cartonWeight", label: "装箱重量", required: false },
  { key: "moq", label: "MOQ", required: false },
  { key: "link1688", label: "1688链接", required: false },
  { key: "creator", label: "创建者", required: false, defaultHidden: true },
  { key: "createdAt", label: "创建时间", required: false, defaultHidden: true },
  { key: "updater", label: "最后修改者", required: false },
  { key: "updatedAt", label: "最后修改时间", required: false }
]

// 扩展 Product 类型以包含关联字段
type ProductWithRelations = Product & {
  images: ProductImage[]
  creator: User | null
  updater: User | null
}

// 列定义
export const columns: ColumnDef<ProductWithRelations, any>[] = [
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
  {
    id: "mainImage",
    header: "主图",
    cell: ({ row }) => {
      const [detailOpen, setDetailOpen] = useState(false)
      const mainImage = row.original.images?.find(img => img.isMain)
      
      return (
        <>
          <div 
            className="relative w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setDetailOpen(true)}
          >
            {mainImage ? (
              <img
                src={mainImage.url}
                alt={row.original.description}
                className="object-cover w-full h-full rounded"
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center text-gray-400">
                无图片
              </div>
            )}
          </div>

          <ProductDetailDialog
            product={row.original}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onSuccess={() => {
              setDetailOpen(false)
              window.location.reload()
            }}
          />
        </>
      )
    }
  },
  {
    accessorKey: "itemNo",
    header: "商品编号",
  },
  {
    accessorKey: "barcode",
    header: "条形码",
  },
  {
    accessorKey: "category",
    header: "类别",
    cell: ({ row }) => row.original.category || '-'
  },
  {
    accessorKey: "description",
    header: "商品描述",
  },
  {
    accessorKey: "cost",
    header: "成本",
    cell: ({ row }) => `¥${row.getValue<number>("cost").toFixed(2)}`,
  },
  {
    accessorKey: "supplier",
    header: "供应商",
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
    header: "箱重(kg)",
    cell: ({ row }) => {
      const weight = row.getValue<number | null>("cartonWeight")
      return weight ? `${weight.toFixed(2)}kg` : '-'
    }
  },
  {
    accessorKey: "moq",
    header: "MOQ",
    cell: ({ row }) => {
      const moq = row.getValue<number | null>("moq")
      return moq ? moq.toLocaleString() : '-'
    }
  },
  {
    accessorKey: "link1688",
    header: "1688链接",
    cell: ({ row }) => {
      const link = row.getValue<string | null>("link1688")
      return link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700"
        >
          查看
        </a>
      ) : null
    }
  },
  {
    accessorKey: "creator",
    header: "创建者",
    cell: ({ row }) => {
      const creator = row.original.creator
      return creator ? (
        <div className="flex items-center gap-2">
          {creator.image && (
            <img 
              src={creator.image} 
              alt={creator.name || ''} 
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>{creator.name}</span>
        </div>
      ) : '-'
    }
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
    cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
  },
  {
    accessorKey: "updater",
    header: "最后修改者",
    cell: ({ row }) => {
      const updater = row.original.updater
      return updater ? (
        <div className="flex items-center gap-2">
          {updater.image && (
            <img 
              src={updater.image} 
              alt={updater.name || ''} 
              className="w-6 h-6 rounded-full"
            />
          )}
          <span>{updater.name}</span>
        </div>
      ) : '-'
    }
  },
  {
    accessorKey: "updatedAt",
    header: "最后修改时间",
    cell: ({ row }) => {
      return format(new Date(row.original.updatedAt), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })
    }
  },
  {
    accessorKey: "isActive",
    header: "状态",
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>("isActive")
      return (
        <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
          {isActive ? "已上线" : "已下线"}
        </Badge>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      const [editOpen, setEditOpen] = useState(false)
      const product = row.original
      const isDeleted = new Date(product.updatedAt).getTime() === new Date('2000-01-01').getTime()
      const onToggleActive = table.options.meta?.onToggleActive as (id: string, currentStatus: boolean) => void

      const handleRestore = async () => {
        try {
          const response = await fetch('/api/products/restore', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: [product.id] })
          })

          const result = await response.json()
          
          if (!response.ok) {
            throw new Error(result.error || '恢复失败')
          }

          toast.success('商品已恢复')
          window.location.reload()
        } catch (error) {
          console.error('恢复失败:', error)
          toast.error(error instanceof Error ? error.message : '恢复失败')
        }
      }

      return (
        <div className="flex justify-end gap-2">
          {isDeleted ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRestore}
              title="恢复商品"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditOpen(true)}
                title="编辑商品"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToggleActive?.(product.id, product.isActive)}
                title={product.isActive ? "下线商品" : "上线商品"}
              >
                {product.isActive ? "下线" : "上线"}
              </Button>
            </>
          )}
          
          <EditProductForm
            product={product}
            open={editOpen}
            onOpenChange={setEditOpen}
            onSuccess={() => {
              setEditOpen(false)
              window.location.reload()
            }}
          />
        </div>
      )
    }
  }
] 