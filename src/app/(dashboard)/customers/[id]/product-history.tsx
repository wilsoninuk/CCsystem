"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { ProductImage } from "@/components/ui/image"
import { ImageGallery } from "@/app/(dashboard)/products/components/image-gallery"
import type { CustomerProductHistory, Product, ProductImage as ProductImageType } from "@prisma/client"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ExtendedProduct extends Product {
  images: ProductImageType[]
}

interface ProductHistoryProps {
  history: (CustomerProductHistory & {
    product: ExtendedProduct
    quotationNumber?: string
    quotationId?: string
  })[]
}

export function ProductHistory({ history }: ProductHistoryProps) {
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null)
  const [filters, setFilters] = useState({
    quotationNumber: "all",
    barcode: "",
    shippedAt: null as Date | null,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState("50")

  // 获取所有不重复的报价单号
  const uniqueQuotations = Array.from(new Set(
    history
      .filter(item => item.quotationNumber)
      .map(item => item.quotationNumber)
  )).sort((a, b) => (b || "").localeCompare(a || ""))

  // 过滤历史记录
  const filteredHistory = history.filter((item) => {
    const matchQuotation = filters.quotationNumber === "all" || 
      item.quotationNumber === filters.quotationNumber
    
    const matchBarcode = !filters.barcode || 
      item.product.barcode.toLowerCase().includes(filters.barcode.toLowerCase())
    
    const matchDate = !filters.shippedAt || 
      formatDate(item.shippedAt) === formatDate(filters.shippedAt)

    return matchQuotation && matchBarcode && matchDate
  })

  // 分页逻辑
  const totalItems = filteredHistory.length
  const totalPages = Math.ceil(totalItems / Number(itemsPerPage))
  const startIndex = (currentPage - 1) * Number(itemsPerPage)
  const endIndex = Math.min(startIndex + Number(itemsPerPage), totalItems)
  const currentItems = filteredHistory.slice(startIndex, endIndex)

  // 页面改变处理
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // 每页显示数量改变处理
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value)
    setCurrentPage(1) // 重置到第一页
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">商品出货历史</h2>
        <div className="flex items-center gap-2">
          <Label>每页显示</Label>
          <Select
            value={itemsPerPage}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="选择数量" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50条</SelectItem>
              <SelectItem value="100">100条</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>报价单号</Label>
          <Select
            value={filters.quotationNumber}
            onValueChange={(value) => {
              setFilters(prev => ({ ...prev, quotationNumber: value }))
              setCurrentPage(1) // 重置到第一页
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择报价单号" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {uniqueQuotations.map((number) => (
                number && <SelectItem key={number} value={number}>{number}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="barcode">商品条码</Label>
          <Input
            id="barcode"
            placeholder="输入商品条码筛选"
            value={filters.barcode}
            onChange={(e) => {
              setFilters(prev => ({ ...prev, barcode: e.target.value }))
              setCurrentPage(1) // 重置到第一页
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>出货日期</Label>
          <DatePicker
            value={filters.shippedAt}
            onChange={(date: Date | null) => {
              setFilters(prev => ({ ...prev, shippedAt: date }))
              setCurrentPage(1) // 重置到第一页
            }}
          />
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>主图</TableHead>
            <TableHead>商品编号</TableHead>
            <TableHead>条形码</TableHead>
            <TableHead>商品描述</TableHead>
            <TableHead>类别</TableHead>
            <TableHead>供应商</TableHead>
            <TableHead>款式/颜色</TableHead>
            <TableHead>材料</TableHead>
            <TableHead>成本</TableHead>
            <TableHead>出货价格(RMB)</TableHead>
            <TableHead>出货价格(USD)</TableHead>
            <TableHead>出货数量</TableHead>
            <TableHead>出货时间</TableHead>
            <TableHead>报价单号</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div 
                  className="relative w-16 h-16 cursor-pointer"
                  onClick={() => setSelectedProduct(item.product)}
                >
                  <ProductImage
                    src={item.product.images.find(img => img.isMain)?.url || null}
                    alt={item.product.description}
                  />
                </div>
              </TableCell>
              <TableCell>{item.product.itemNo}</TableCell>
              <TableCell>{item.product.barcode}</TableCell>
              <TableCell>{item.product.description}</TableCell>
              <TableCell>{item.product.category}</TableCell>
              <TableCell>{item.product.supplier}</TableCell>
              <TableCell>{item.product.color}</TableCell>
              <TableCell>{item.product.material}</TableCell>
              <TableCell>¥{item.product.cost.toFixed(2)}</TableCell>
              <TableCell>¥{item.priceRMB.toFixed(2)}</TableCell>
              <TableCell>${item.priceUSD.toFixed(2)}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{formatDate(item.shippedAt)}</TableCell>
              <TableCell>
                {item.quotationNumber && item.quotationId && (
                  <Link 
                    href={`/quotations/${item.quotationId}`}
                    className="text-primary hover:underline"
                  >
                    {item.quotationNumber}
                  </Link>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          显示 {startIndex + 1}-{endIndex} 条，共 {totalItems} 条
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            上一页
          </Button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            下一页
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selectedProduct && (
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>商品图片</DialogTitle>
            </DialogHeader>
            <ImageGallery
              mainImage={selectedProduct.images.find(img => img.isMain)?.url || null}
              additionalImages={selectedProduct.images.filter(img => !img.isMain).map(img => img.url)}
              onMainImageChange={async () => {}}
              onAdditionalImagesChange={async () => {}}
              disabled={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 