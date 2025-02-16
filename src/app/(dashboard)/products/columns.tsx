"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"  // 使用 Prisma 生成的类型

export const columns: ColumnDef<Product>[] = [
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
    accessorKey: "cost",
    header: "成本",
    cell: ({ row }) => {
      const cost = parseFloat(row.getValue("cost"))
      return `¥${cost.toFixed(2)}`
    },
  },
  {
    accessorKey: "supplier",
    header: "供应商",
  },
] 