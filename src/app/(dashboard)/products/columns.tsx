"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Product } from "@prisma/client"  // 使用 Prisma 生成的类型
import { Button } from "@/components/ui/button"
import { Edit, Trash, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

// 基础列 - 始终显示
export const baseColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "itemNo",
    header: "商品编号",
  },
  {
    accessorKey: "picture",
    header: "图片",
    cell: ({ row }) => {
      const picture = row.getValue("picture") as string
      return picture ? (
        <div className="relative w-10 h-10">
          <Image
            src={picture}
            alt="商品图片"
            fill
            className="object-cover rounded-md"
          />
        </div>
      ) : null
    }
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

// 展开后显示的详细信息
export const renderSubComponent = ({ row }: { row: any }) => {
  const product = row.original
  
  return (
    <div className="p-4 bg-gray-50 rounded-md space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">条形码</div>
          <div>{product.barcode}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">颜色/款式</div>
          <div>{product.colorAndStyle || '-'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">材料</div>
          <div>{product.material || '-'}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">产品尺寸</div>
          <div>{product.productSize || '-'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">装箱尺寸</div>
          <div>{product.cartonSize || '-'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">装箱重量</div>
          <div>{product.cartonWeight ? `${product.cartonWeight}kg` : '-'}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">MOQ</div>
          <div>{product.moq || '-'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">供应商</div>
          <div>{product.supplier || '-'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">1688链接</div>
          <div>
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

// 创建一个函数来生成当前可见的列
export function getVisibleColumns(selectedKeys: string[]) {
  return [
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
    // 基础列
    ...baseColumns,
    // 可选列
    ...optionalColumns.filter(col => {
      const column = col as { accessorKey?: string }
      return column.accessorKey && selectedKeys.includes(column.accessorKey)
    }),
    // 操作列
    actionColumn
  ]
} 