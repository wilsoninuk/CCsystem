"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Product, ProductImage, User } from "@prisma/client"
import Image from "next/image"
import { useState } from "react"
import { ProductDetailDialog } from "./product-detail-dialog"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditProductForm } from "./edit-product-form"

// 扩展 Product 类型以包含关联字段
type ProductWithRelations = Product & {
  images: ProductImage[]
  creator: User | null
  updater: User | null
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    id: "mainImage",
    header: "主图",
    cell: ({ row }) => {
      const [detailOpen, setDetailOpen] = useState(false)
      const mainImage = row.original.images?.find(img => img.isMain)?.url || row.original.picture
      
      return (
        <>
          <div 
            className="relative w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setDetailOpen(true)}
          >
            {mainImage ? (
              <img
                src={mainImage}
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
    accessorKey: "description",
    header: "商品描述",
  },
  {
    accessorKey: "category",
    header: "类别",
    cell: ({ row }) => row.original.category || '-'
  },
  {
    accessorKey: "cost",
    header: "成本",
    cell: ({ row }) => `¥${row.original.cost.toFixed(2)}`
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
    cell: ({ row }) => format(new Date(row.original.updatedAt), 'yyyy-MM-dd HH:mm')
  },
  {
    accessorKey: "supplier",
    header: "供应商",
    cell: ({ row }) => row.original.supplier || '-'
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const [editOpen, setEditOpen] = useState(false)
      const product = row.original

      return (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditOpen(true)}
          >
            <Edit className="h-4 w-4" />
          </Button>
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