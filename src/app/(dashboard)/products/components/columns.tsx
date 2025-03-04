"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Product, ProductImage, User } from "@prisma/client"
import Image from "next/image"

// 扩展 Product 类型以包含关联字段
type ProductWithRelations = Product & {
  images: ProductImage[]
  creator: User | null
  updater: User | null
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    accessorKey: "images",
    header: "图片",
    cell: ({ row }) => {
      const mainImage = row.original.images?.find(img => img.isMain)
      return mainImage ? (
        <div className="relative w-10 h-10">
          <Image
            src={mainImage.url}
            alt={row.original.description}
            fill
            className="object-cover rounded-sm"
          />
        </div>
      ) : (
        <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center text-gray-400 text-xs">
          无图片
        </div>
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
  }
] 