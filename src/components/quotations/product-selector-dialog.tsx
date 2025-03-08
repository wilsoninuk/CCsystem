"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ProductImage } from "@/components/ui/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useQuery } from "@tanstack/react-query"

interface Product {
  id: string
  itemNo: string
  barcode: string
  description: string
  category: string
  supplier: string
  cost?: number
  images?: Array<{
    id: string
    url: string
    isMain: boolean
  }>
  picture?: string
}

interface ProductSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (products: Array<{ product: Product; quantity: number }>) => void
}

export function ProductSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
}: ProductSelectorDialogProps) {
  const [selectedProducts, setSelectedProducts] = useState<
    Map<string, { product: Product; quantity: number }>
  >(new Map())
  
  const [filters, setFilters] = useState({
    search: "",
    category: "all",
    supplier: "all",
  })

  // 获取商品数据
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', filters],
    queryFn: async () => {
      console.log('开始获取产品数据...')
      const searchParams = new URLSearchParams()
      if (filters.search) searchParams.append('search', filters.search)
      if (filters.category) searchParams.append('category', filters.category)
      if (filters.supplier) searchParams.append('supplier', filters.supplier)
      
      const response = await fetch(`/api/products?${searchParams.toString()}`)
      const data = await response.json()
      console.log('API返回的完整产品数据:', data)
      
      // 检查第一个产品的图片数据
      if (data.length > 0) {
        console.log('第一个产品的图片数据:', {
          productId: data[0].id,
          images: data[0].images,
          picture: data[0].picture
        })
      }
      
      return data
    },
  })

  // 获取品类和供应商选项
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await fetch('/api/products/categories')
      return response.json()
    },
  })

  const { data: suppliers = [] } = useQuery<string[]>({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const response = await fetch('/api/products/suppliers')
      return response.json()
    },
  })

  const handleProductSelect = (product: Product, checked: boolean) => {
    const newSelected = new Map(selectedProducts)
    if (checked) {
      newSelected.set(product.id, { product, quantity: 1 })
    } else {
      newSelected.delete(product.id)
    }
    setSelectedProducts(newSelected)
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    const newSelected = new Map(selectedProducts)
    const item = newSelected.get(productId)
    if (item) {
      newSelected.set(productId, { ...item, quantity })
      setSelectedProducts(newSelected)
    }
  }

  const handleConfirm = () => {
    onConfirm(Array.from(selectedProducts.values()))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[60vw] min-w-[900px] min-h-[600px] h-[80vh]">
        <DialogHeader>
          <DialogTitle>选择商品</DialogTitle>
        </DialogHeader>
        
        <div className="flex h-full gap-4">
          {/* 左侧商品列表 */}
          <div className="flex-[6] flex flex-col">
            <div className="space-y-4 mb-4">
              <Input
                placeholder="搜索商品编号、条形码或名称"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>品类</Label>
                  <Select
                    value={filters.category}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择品类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      {categories.map((category) => (
                        category && <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>供应商</Label>
                  <Select
                    value={filters.supplier}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, supplier: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      {suppliers.map((supplier) => (
                        supplier && <SelectItem key={supplier} value={supplier}>{supplier}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 border rounded-md">
              <div className="divide-y">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center p-2 hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={(checked) => handleProductSelect(product, checked as boolean)}
                      className="mr-2"
                    />
                    <div className="w-[120px] truncate">{product.barcode}</div>
                    <div className="w-[20px] h-[20px] mx-2">
                      <ProductImage
                        src={product.images?.find(img => img.isMain)?.url || product.picture || null}
                        alt={product.description}
                      />
                    </div>
                    <div className="w-[80px] truncate">{product.category}</div>
                    <div className="flex-1 truncate">{product.description}</div>
                    <div className="w-[100px] truncate">{product.supplier}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* 右侧已选商品 */}
          <div className="flex-[4] flex flex-col">
            <h3 className="font-medium mb-4">
              已选商品 ({selectedProducts.size})
            </h3>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="divide-y p-2">
                {Array.from(selectedProducts.values()).map(({ product, quantity }) => (
                  <div key={product.id} className="py-2">
                    <div className="flex items-center gap-2">
                      <div className="w-[20px] h-[20px]">
                        <ProductImage
                          src={product.images?.find(img => img.isMain)?.url || product.picture || null}
                          alt={product.description}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {product.barcode}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Label className="whitespace-nowrap">数量</Label>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(product.id, parseInt(e.target.value) || 1)}
                            className="w-16"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleProductSelect(product, false)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Button onClick={handleConfirm} className="mt-4">
              确认添加 ({selectedProducts.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 