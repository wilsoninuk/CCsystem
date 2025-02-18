"use client"

import { useState } from "react"
import { Product } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ProductSelector } from "./product-selector"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Trash, Palette, Check } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ExportOptions } from './export-options'
import { exportToExcel } from '@/lib/excel'
import { QuotationItem } from "@/types/quotation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ColumnSelector } from "../column-selector"
import { QUOTATION_COLUMNS } from "../columns-config"

interface QuotationItemsProps {
  customerId: string
  items: QuotationItem[]
  exchangeRate: number
  onItemsChangeAction: (items: QuotationItem[]) => void
}

// 定义颜色选项 - 使用更深的颜色
const colorOptions = [
  { 
    value: 'blue', 
    label: '蓝色', 
    class: 'bg-blue-100 hover:bg-blue-200',  // 加深背景色
    iconClass: 'text-blue-600'  // 加深图标色
  },
  { 
    value: 'purple', 
    label: '紫色', 
    class: 'bg-purple-100 hover:bg-purple-200',
    iconClass: 'text-purple-600'
  },
  { 
    value: 'pink', 
    label: '粉色', 
    class: 'bg-pink-100 hover:bg-pink-200',
    iconClass: 'text-pink-600'
  },
] as const

// 格式化数字的辅助函数
const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num)
}

export function QuotationItems({
  customerId,
  items,
  exchangeRate,
  onItemsChangeAction
}: QuotationItemsProps) {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    "barcode",
    "supplier",
    "totalRMB",
    "totalUSD",
    "profit",
    "remark"
  ])

  // 获取要显示的列
  const visibleColumns = QUOTATION_COLUMNS.filter(
    col => col.required || selectedColumns.includes(col.key)
  )

  // 计算总利润
  const totalProfit = items.reduce((sum, item) => {
    const totalRMB = (item.exwPriceRMB || 0) * item.quantity
    const shipping = item.shipping || 0
    const totalCost = (item.product.cost + shipping) * item.quantity
    return sum + (totalRMB - totalCost)
  }, 0)

  // 渲染单元格内容
  const renderCell = (key: string, item: QuotationItem, index: number) => {
    switch (key) {
      case "picture":
        return item.product?.picture && (
          <div className="relative w-10 h-10">
            <Image
              src={item.product.picture}
              alt={item.product.description}
              fill
              className="object-cover rounded-sm"
            />
          </div>
        )
      case "itemNo":
        return item.product?.itemNo
      case "barcode":
        return item.barcode
      case "description":
        return item.product?.description
      case "supplier":
        return item.product?.supplier?.name
      case "cost":
        return item.product?.cost && `¥${formatNumber(item.product.cost)}`
      case "shipping":
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.shipping ?? ''}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index] = {
                ...item,
                shipping: e.target.value === '' ? null : Number(e.target.value)
              }
              onItemsChangeAction(newItems)
            }}
            placeholder="0"
            className="w-24 text-right"
          />
        )
      case "quantity":
        return (
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index] = {
                ...item,
                quantity: Number(e.target.value)
              }
              onItemsChangeAction(newItems)
            }}
            className="w-20 text-right"
          />
        )
      case "priceRMB":
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.exwPriceRMB || ''}
            onChange={(e) => {
              const newPrice = Number(e.target.value)
              const newItems = [...items]
              newItems[index] = {
                ...item,
                exwPriceRMB: newPrice,
                exwPriceUSD: newPrice / exchangeRate
              }
              onItemsChangeAction(newItems)
            }}
            className="w-24 text-right"
          />
        )
      case "priceUSD":
        return (
          <Input
            type="number"
            min="0"
            step="0.01"
            value={item.exwPriceUSD || ''}
            onChange={(e) => {
              const newPrice = Number(e.target.value)
              const newItems = [...items]
              newItems[index] = {
                ...item,
                exwPriceUSD: newPrice,
                exwPriceRMB: newPrice * exchangeRate
              }
              onItemsChangeAction(newItems)
            }}
            className="w-24 text-right"
          />
        )
      case "totalRMB":
        return `¥${formatNumber((item.exwPriceRMB || 0) * item.quantity)}`
      case "totalUSD":
        return `$${formatNumber((item.exwPriceUSD || 0) * item.quantity)}`
      case "profit":
        const profit = (item.exwPriceRMB || 0) * item.quantity - 
          (item.product.cost + (item.shipping || 0)) * item.quantity
        return (
          <span className={cn(
            profit > 0 ? "text-green-600" : profit < 0 ? "text-red-600" : ""
          )}>
            ¥{formatNumber(profit)}
          </span>
        )
      case "remark":
        return (
          <Input
            value={item.remark || ''}
            onChange={(e) => {
              const newItems = [...items]
              newItems[index] = {
                ...item,
                remark: e.target.value
              }
              onItemsChangeAction(newItems)
            }}
            className="w-32"
          />
        )
      default:
        return null
    }
  }

  // 处理导出
  const handleExport = (options: {
    includeCost: boolean
    includeProfit: boolean
    includeUSD: boolean
    includeRMB: boolean
  }) => {
    exportToExcel(items, options)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ColumnSelector
          selectedColumns={selectedColumns}
          onChange={setSelectedColumns}
        />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const totalRMB = (item.exwPriceRMB || 0) * item.quantity
            const totalUSD = (item.exwPriceUSD || 0) * item.quantity
            const shipping = item.shipping || 0
            const totalCost = (item.product.cost + shipping) * item.quantity
            const profit = totalRMB - totalCost

            const hasChanges = 
              item.exwPriceRMB !== item.product.cost || 
              item.quantity !== 1 ||
              item.shipping !== null;

            return (
              <TableRow 
                key={index}
                className={cn(
                  "transition-colors",
                  item.color && colorOptions.find(c => c.value === item.color)?.class,
                  !item.color && hasChanges && 'bg-gray-50'
                )}
              >
                {visibleColumns.map(col => (
                  <TableCell key={col.key}>
                    {renderCell(col.key, item, index)}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className={cn(
                            "hover:bg-gray-100",
                            item.color && colorOptions.find(c => c.value === item.color)?.iconClass
                          )}
                        >
                          <Palette className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {colorOptions.map((color) => (
                          <DropdownMenuItem
                            key={color.value}
                            onClick={() => {
                              const newItems = [...items]
                              newItems[index] = {
                                ...item,
                                color: item.color === color.value ? null : color.value
                              }
                              onItemsChangeAction(newItems)
                            }}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2",
                              color.class
                            )}
                          >
                            <div className={cn(
                              "w-3 h-3 rounded-full",
                              color.iconClass,
                              "border border-current"
                            )} />
                            <span className="flex-1">{color.label}</span>
                            {item.color === color.value && (
                              <Check className={cn("h-4 w-4", color.iconClass)} />
                            )}
                          </DropdownMenuItem>
                        ))}
                        {item.color && (
                          <>
                            <DropdownMenuItem
                              className="border-t mt-1 pt-1 text-muted-foreground"
                              onClick={() => {
                                const newItems = [...items]
                                newItems[index] = {
                                  ...item,
                                  color: null
                                }
                                onItemsChangeAction(newItems)
                              }}
                            >
                              清除标记
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newItems = items.filter((_, i) => i !== index)
                        onItemsChangeAction(newItems)
                      }}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            {/* 从图片列到单价(USD)列都空着 */}
            <TableCell colSpan={visibleColumns.length - 2} />
            {/* 总价(RMB)列 */}
            <TableCell className="text-right font-bold">
              ¥{formatNumber(items.reduce((sum, item) => sum + (item.exwPriceRMB || 0) * item.quantity, 0))}
            </TableCell>
            {/* 总价(USD)列 */}
            <TableCell className="text-right font-bold">
              ${formatNumber(items.reduce((sum, item) => sum + (item.exwPriceUSD || 0) * item.quantity, 0))}
            </TableCell>
            {/* 利润(RMB)列 */}
            <TableCell className={cn(
              "text-right font-bold",
              totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : ""
            )}>
              ¥{formatNumber(totalProfit)}
            </TableCell>
            {/* 备注和操作列 */}
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
} 