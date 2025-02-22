"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ImageUpload } from "./components/image-upload"
import { useRouter } from "next/navigation"

// 定义可选列配置
export const OPTIONAL_COLUMNS = [
  { key: "picture", label: "商品图片", required: true },
  { key: "itemNo", label: "商品编号", required: true },
  { key: "barcode", label: "条形码", required: false },
  { key: "description", label: "商品描述", required: true },
  { key: "cost", label: "成本", required: true },
  { key: "supplier", label: "供应商", required: false },
  { key: "color", label: "颜色/款式", required: false },
  { key: "material", label: "材料", required: false },
  { key: "productSize", label: "产品尺寸", required: false },
  { key: "cartonSize", label: "装箱尺寸", required: false },
  { key: "cartonWeight", label: "装箱重量", required: false },
  { key: "moq", label: "MOQ", required: false },
  { key: "link1688", label: "1688链接", required: false },
] as const

// 列定义
export const columns: ColumnDef<Product>[] = [
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
    accessorKey: "picture",
    header: "商品图片",
    cell: ({ row }) => {
      const picture = row.getValue<string | null>("picture")
      return (
        <div className="flex items-center space-x-2">
          {picture ? (
            <div className="relative w-16 h-16">
              <Image
                src={picture}
                alt={row.getValue("description")}
                fill
                className="object-contain rounded-sm"
                unoptimized
              />
            </div>
          ) : null}
          <ImageUpload 
            productId={row.original.id}
            currentImage={picture}
            onUploadSuccess={(newImageUrl) => {
              window.location.reload()
            }}
          />
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
    header: "装箱重量(kg)",
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
  }
] 