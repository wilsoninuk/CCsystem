"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"  // 使用 Prisma 生成的类型
import { Button } from "@/components/ui/button"
import { Edit, Trash, ChevronDown, ChevronRight, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { ProductImage } from "@/components/ui/image"

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
  {
    accessorKey: "itemNo",
    header: "商品编号",
  },
  {
    accessorKey: "picture",
    header: "商品图片",
    cell: ({ row }) => {
      const picture = row.original.picture
      return picture ? (
        <div className="w-20 h-20">
          <ProductImage
            src={picture}
            alt={row.original.description || "商品图片"}
          />
        </div>
      ) : (
        <div className="w-20 h-20 flex items-center justify-center border rounded-md bg-gray-50">
          <span className="text-sm text-gray-400">无图片</span>
        </div>
      )
    },
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

// 操作列 - 始终显示在最后
export const actionColumn: ColumnDef<Product> = {
  id: "actions",
  header: "操作",
  cell: ({ row }) => {
    const product = row.original
    return (
      <div className="flex items-center gap-2">
        <Link href={`/products/${product.id}/edit`}>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </Link>
        <Button variant="outline" size="sm" className="text-red-500">
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

// 修改 getVisibleColumns 函数，添加展开功能
export function getVisibleColumns(selectedKeys: string[]) {
  return [
    // 选择列
    baseColumns[0],
    // 展开器列
    {
      id: "expander",
      header: () => null,
      cell: ({ row }: { row: any }) => {
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
    // 其他基础列
    ...baseColumns.slice(1),
    // 可选列
    ...optionalColumns.filter(col => {
      const column = col as { accessorKey?: string }
      return column.accessorKey && selectedKeys.includes(column.accessorKey)
    }),
    // 操作列
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