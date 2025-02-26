"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { Product } from "@prisma/client"
import Image from "next/image"

// 扩展 Product 类型以包含关联字段
type ProductWithRelations = Product & {
  creator?: {
    name: string | null
    email: string | null
  } | null
}

export const columns: ColumnDef<ProductWithRelations>[] = [
  {
    accessorKey: "picture",
    header: "图片",
    cell: ({ row }) => {
      const picture = row.original.picture
      return picture ? (
        <div className="relative w-10 h-10">
          <Image
            src={picture}
            alt={row.original.description}
            fill
            className="object-cover rounded-sm"
          />
        </div>
      ) : null
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
    cell: ({ row }) => row.original.creator?.name || '-'
  },
  {
    accessorKey: "createdAt",
    header: "创建时间",
    cell: ({ row }) => format(new Date(row.original.createdAt), 'yyyy-MM-dd HH:mm')
  },
  {
    accessorKey: "supplier",
    header: "供应商",
    cell: ({ row }) => row.original.supplier || '-'
  }
] 