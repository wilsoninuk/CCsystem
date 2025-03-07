"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ProductList } from "./product-list"
import { SelectedProducts } from "./selected-products"
import { Button } from "@/components/ui/button"
import type { Product, ProductImage } from "@prisma/client"

interface ExtendedProduct extends Product {
  images: ProductImage[]
}

interface ProductSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (products: Array<{ product: ExtendedProduct; quantity: number }>) => void
}

export function ProductSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
}: ProductSelectorDialogProps) {
  const [selectedProducts, setSelectedProducts] = useState<
    Array<{ product: ExtendedProduct; quantity: number }>
  >([])

  // 处理商品选择
  const handleProductSelect = (product: ExtendedProduct, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, { product, quantity: 1 }])
    } else {
      setSelectedProducts(prev => prev.filter(item => item.product.id !== product.id))
    }
  }

  // 处理数量更新
  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedProducts(prev =>
      prev.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  // 处理移除商品
  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts(prev => prev.filter(item => item.product.id !== productId))
  }

  // 处理确认选择
  const handleConfirm = () => {
    onConfirm(selectedProducts)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[60vw] min-w-[900px] h-[80vh] min-h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>选择商品</DialogTitle>
        </DialogHeader>
        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* 左侧商品列表 */}
          <div className="w-[60%] flex flex-col overflow-hidden">
            <ProductList
              selectedProductIds={selectedProducts.map(item => item.product.id)}
              onProductSelect={handleProductSelect}
            />
          </div>
          
          {/* 右侧已选商品 */}
          <div className="w-[40%] flex flex-col overflow-hidden">
            <SelectedProducts
              selectedProducts={selectedProducts}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemoveProduct}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleConfirm} disabled={selectedProducts.length === 0}>
                确认添加到报价单
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 