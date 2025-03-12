"use client"

import { useState, useMemo } from "react"
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
import { Trash, Palette, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
import { ProductImage } from "@/components/ui/product-image"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { exportQuotationToExcel } from '@/lib/excel'

interface QuotationItemsProps {
  customerId: string
  items: QuotationItem[]
  exchangeRate: number
  onItemsChangeAction: (items: QuotationItem[]) => void
  onImageClick?: (item: QuotationItem) => void
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
  onItemsChangeAction,
  onImageClick
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

  // 新增状态
  const [search, setSearch] = useState("")
  const [supplierFilter, setSupplierFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [pageSize, setPageSize] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null })

  // 获取要显示的列
  const visibleColumns = QUOTATION_COLUMNS.filter(
    col => col.required || selectedColumns.includes(col.key)
  )

  // 计算总利润
  const totalProfit = items.reduce((sum, item) => {
    const totalRMB = (item.exwPriceRMB || 0) * item.quantity
    const shipping = item.shipping || 0
    const totalCost = item.product.cost * item.quantity + shipping
    return sum + (totalRMB - totalCost)
  }, 0)

  // 获取唯一的供应商和品类列表
  const suppliers = useMemo(() => {
    const uniqueSuppliers = new Set(items.map(item => item.product.supplier.name))
    return Array.from(uniqueSuppliers).filter(Boolean)
  }, [items])

  const categories = useMemo(() => {
    const uniqueCategories = new Set(items.map(item => item.product.category))
    return Array.from(uniqueCategories).filter(Boolean)
  }, [items])

  // 处理排序
  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: 
        current.key === key
          ? current.direction === 'asc'
            ? 'desc'
            : current.direction === 'desc'
              ? null
              : 'asc'
          : 'asc'
    }))
  }

  // 过滤和排序后的数据
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items]
    
    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(item => 
        item.product.itemNo.toLowerCase().includes(searchLower) ||
        item.product.barcode.toLowerCase().includes(searchLower)
      )
    }

    // 供应商过滤
    if (supplierFilter !== 'all') {
      result = result.filter(item => item.product.supplier.name === supplierFilter)
    }

    // 品类过滤
    if (categoryFilter !== 'all') {
      result = result.filter(item => item.product.category === categoryFilter)
    }

    // 排序
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        let aValue: number = 0
        let bValue: number = 0

        switch (sortConfig.key) {
          case 'totalRMB':
            aValue = a.exwPriceRMB * a.quantity
            bValue = b.exwPriceRMB * b.quantity
            break
          case 'totalUSD':
            aValue = a.exwPriceUSD * a.quantity
            bValue = b.exwPriceUSD * b.quantity
            break
          case 'profit':
            aValue = (a.profit || 0)
            bValue = (b.profit || 0)
            break
          case 'profitRate':
            aValue = (a.profitRate || 0)
            bValue = (b.profitRate || 0)
            break
          default:
            return 0
        }

        return sortConfig.direction === 'asc' 
          ? aValue - bValue 
          : bValue - aValue
      })
    }

    return result
  }, [items, search, supplierFilter, categoryFilter, sortConfig])

  // 分页数据
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredAndSortedItems.slice(startIndex, startIndex + pageSize)
  }, [filteredAndSortedItems, currentPage, pageSize])

  const totalPages = Math.ceil(filteredAndSortedItems.length / pageSize)

  // 渲染排序图标
  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="h-4 w-4" />
    if (sortConfig.direction === 'asc') return <ArrowUp className="h-4 w-4" />
    if (sortConfig.direction === 'desc') return <ArrowDown className="h-4 w-4" />
    return <ArrowUpDown className="h-4 w-4" />
  }

  // 渲染单元格内容
  const renderCell = (key: string, item: QuotationItem, index: number) => {
    switch (key) {
      case "picture":
        return null
      case "itemNo":
        return item.product?.itemNo
      case "barcode":
        return item.barcode
      case "category":
        return item.product?.category || "-"
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
                exwPriceUSD: Number((newPrice / exchangeRate).toFixed(2))
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
                exwPriceRMB: Number((newPrice * exchangeRate).toFixed(2))
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
          (item.product.cost * item.quantity + (item.shipping || 0))
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
      case "historyPriceRMB":
        if (!item.historyPrice?.price) {
          console.log('无历史价格:', {
            productId: item.productId,
            historyPrice: item.historyPrice,
            message: '没有找到历史出货价格'
          })
          return "-"
        }
        console.log('显示历史价格:', {
          productId: item.productId,
          price: item.historyPrice.price,
          date: item.historyPrice.date,
          status: item.historyPrice.status,
          currentPrice: item.exwPriceRMB
        })
        const priceDate = item.historyPrice.date ? 
          new Date(item.historyPrice.date).toLocaleDateString('zh-CN') : ''
        const status = item.historyPrice.status ? 
          item.historyPrice.status === 'COMPLETED' ? '已出货' :
          item.historyPrice.status === 'SHIPPED' ? '已出货' :
          item.historyPrice.status === 'PI_GENERATED' ? 'PI报价' :
          item.historyPrice.status === 'CI_GENERATED' ? 'CI报价' : '' : ''
        
        const historyPrice = item.historyPrice.price
        const currentPrice = item.exwPriceRMB || 0
        const priceDiff = currentPrice - historyPrice
        
        return (
          <div 
            className={cn(
              "text-right whitespace-nowrap",
              priceDiff > 0 ? "text-red-600" : 
              priceDiff < 0 ? "text-green-600" : ""
            )} 
            title={`${priceDate} ${status}`}
          >
            ¥{formatNumber(historyPrice)}
          </div>
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
      {/* 搜索和筛选区 */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Input
            placeholder="搜索商品编码或条形码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={supplierFilter} onValueChange={setSupplierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择供应商" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部供应商</SelectItem>
              {suppliers.map(supplier => (
                <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="选择品类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部品类</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value))
            setCurrentPage(1)
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="每页显示" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">每页 50 条</SelectItem>
              <SelectItem value="100">每页 100 条</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            共 {filteredAndSortedItems.length} 条记录
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => exportQuotationToExcel(items, '报价单.xlsx')}
          >
            导出Excel
          </Button>
          <ColumnSelector
            selectedColumns={selectedColumns}
            onChange={setSelectedColumns}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>图片</TableHead>
            {visibleColumns.filter(col => col.key !== 'picture').map(col => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.map((item, index) => {
            const totalRMB = (item.exwPriceRMB || 0) * item.quantity
            const totalUSD = (item.exwPriceUSD || 0) * item.quantity
            const shipping = item.shipping || 0
            const totalCost = item.product.cost * item.quantity + shipping
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
                <TableCell>
                  <div 
                    className="relative w-16 h-16"
                  >
                    <ProductImage
                      product={{
                        id: item.product.id,
                        barcode: item.barcode,
                        description: item.product.description,
                        itemNo: item.product.itemNo,
                        category: item.product.category,
                        images: item.product.images || []
                      }}
                      className="w-full h-full"
                      onClick={() => {
                        // 确保 images 数据存在
                        const itemWithImages = {
                          ...item,
                          product: {
                            ...item.product,
                            images: item.product.images || []
                          }
                        }
                        console.log('QuotationItems - 点击图片时的完整数据:', {
                          productId: itemWithImages.productId,
                          images: itemWithImages.product.images,
                          picture: itemWithImages.product.picture
                        })
                        onImageClick?.(itemWithImages)
                      }}
                    />
                  </div>
                </TableCell>
                {visibleColumns.filter(col => col.key !== 'picture').map(col => (
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
            {/* 图片列 */}
            <TableCell />
            {visibleColumns.map((col, index) => {
              if (col.key === 'picture') return null; // 跳过图片列，因为已经单独处理
              
              // 对于需要显示总计的列，返回对应的总计单元格
              switch (col.key) {
                case 'quantity':
                  return (
                    <TableCell key={col.key} className="font-bold">
                      {items.reduce((sum, item) => sum + item.quantity, 0)}
                    </TableCell>
                  );
                case 'totalRMB':
                  return (
                    <TableCell key={col.key} className="font-bold">
                      ¥{formatNumber(items.reduce((sum, item) => sum + (item.exwPriceRMB || 0) * item.quantity, 0))}
                    </TableCell>
                  );
                case 'totalUSD':
                  return (
                    <TableCell key={col.key} className="font-bold">
                      ${formatNumber(items.reduce((sum, item) => sum + (item.exwPriceUSD || 0) * item.quantity, 0))}
                    </TableCell>
                  );
                case 'profit':
                  return (
                    <TableCell key={col.key} className={cn(
                      "font-bold",
                      totalProfit > 0 ? "text-green-600" : totalProfit < 0 ? "text-red-600" : ""
                    )}>
                      ¥{formatNumber(totalProfit)}
                    </TableCell>
                  );
                default:
                  // 对于其他列，返回空单元格
                  return <TableCell key={col.key} />;
              }
            })}
            {/* 操作列 */}
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>

      {/* 分页控制 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <span className="text-sm">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={currentPage}
            onChange={(e) => {
              const page = Number(e.target.value)
              if (page >= 1 && page <= totalPages) {
                setCurrentPage(page)
              }
            }}
            className="w-20"
          />
          <span className="text-sm">页</span>
        </div>
      </div>
    </div>
  )
} 