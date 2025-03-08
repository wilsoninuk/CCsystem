"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductSelector } from "./product-selector"
import { QuotationItems } from "./quotation-items"
import { toast } from "sonner"
import type { Customer, Product } from "@prisma/client"
import { CustomerSelect } from "./customer-select"
import { QuotationItem as QuotationItemType } from "@/types/quotation"  // 使用统一的类型定义
import { ProductSelectorDialog } from "@/components/quotations/product-selector-dialog"
import { getProductsHistoryPrices } from "@/lib/services/price-history"
import { Switch } from "@/components/ui/switch"
import { ImageGallery } from "@/app/(dashboard)/products/components/image-gallery"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface NewQuotationFormProps {
  customers: Pick<Customer, "id" | "code" | "name" | "exchangeRate">[]
}

export function NewQuotationForm({ customers }: NewQuotationFormProps) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState<string>("")
  const [exchangeRate, setExchangeRate] = useState<number>(7.2)
  const [items, setItems] = useState<QuotationItemType[]>([])
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<QuotationItemType | null>(null)
  const [isManualNumber, setIsManualNumber] = useState(false)
  const [manualNumber, setManualNumber] = useState('')
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    products: Array<{ barcode: string; description: string }>;
  }>({
    open: false,
    products: []
  });

  const handleAddProduct = async (product: Pick<Product, "id" | "itemNo" | "barcode" | "description" | "picture" | "cost"> & {
    supplier: { name: string }
  }) => {
    // 获取历史价格
    const historyPrices = customerId ? 
      await getProductsHistoryPrices([product.id], customerId) : 
      new Map()

    const newItem: QuotationItemType = {
      id: '',
      quotationId: '',
      productId: product.id,
      barcode: product.barcode,
      serialNo: items.length + 1,
      quantity: 1,
      exwPriceRMB: product.cost,
      exwPriceUSD: Number((product.cost / exchangeRate).toFixed(2)),
      shipping: null,
      remark: null,
      actualQty: null,
      finalPriceRMB: null,
      finalPriceUSD: null,
      profit: null,
      profitRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      product: {
        id: product.id,
        itemNo: product.itemNo,
        barcode: product.barcode,
        description: product.description,
        picture: product.picture,
        cost: product.cost,
        supplier: {
          name: product.supplier.name
        }
      },
      color: null,
      historyPrice: historyPrices.get(product.id) || null
    }
    
    setItems(prev => [...prev, newItem])
  }

  const handleCustomerSelect = (id: string) => {
    setCustomerId(id)
    const customer = customers.find(c => c.id === id)
    if (customer?.exchangeRate) {
      setExchangeRate(customer.exchangeRate)
    }
  }

  const handleProductsSelected = async (products: Array<{ product: Product & { images?: ProductImage[] }; quantity: number }>) => {
    // 检查重复商品
    const duplicateProducts = products.filter(({ product }) => 
      items.some(item => item.barcode === product.barcode)
    )

    // 如果有重复商品，显示对话框
    if (duplicateProducts.length > 0) {
      setDuplicateDialog({
        open: true,
        products: duplicateProducts.map(({ product }) => ({
          barcode: product.barcode,
          description: product.description
        }))
      });
      // 过滤掉重复商品
      const newProducts = products.filter(({ product }) => 
        !items.some(item => item.barcode === product.barcode)
      )
      // 如果没有可添加的新商品，直接返回
      if (newProducts.length === 0) {
        return;
      }
      // 获取所有产品的历史价格
      const productIds = newProducts.map(p => p.product.id);
      const historyPrices = customerId ? 
        await getProductsHistoryPrices(productIds, customerId) : 
        new Map();

      const newItems: QuotationItemType[] = newProducts.map(({ product, quantity }) => ({
        id: '',
        quotationId: '',
        productId: product.id,
        barcode: product.barcode,
        serialNo: items.length + 1,
        quantity: quantity,
        exwPriceRMB: product.cost || 0,
        exwPriceUSD: Number(((product.cost || 0) / exchangeRate).toFixed(2)),
        shipping: null,
        remark: null,
        actualQty: null,
        finalPriceRMB: null,
        finalPriceUSD: null,
        profit: null,
        profitRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: product.id,
          itemNo: product.itemNo,
          barcode: product.barcode,
          description: product.description,
          picture: product.images?.[0]?.url || null,
          cost: product.cost || 0,
          category: product.category,
          supplier: {
            name: product.supplier || ''
          },
          images: product.images || []
        },
        color: null,
        historyPrice: historyPrices.get(product.id) || null
      }))

      setItems(prev => [...prev, ...newItems])
    } else {
      // 如果没有重复商品，直接添加所有商品
      const productIds = products.map(p => p.product.id);
      const historyPrices = customerId ? 
        await getProductsHistoryPrices(productIds, customerId) : 
        new Map();

      const newItems: QuotationItemType[] = products.map(({ product, quantity }) => ({
        id: '',
        quotationId: '',
        productId: product.id,
        barcode: product.barcode,
        serialNo: items.length + 1,
        quantity: quantity,
        exwPriceRMB: product.cost || 0,
        exwPriceUSD: Number(((product.cost || 0) / exchangeRate).toFixed(2)),
        shipping: null,
        remark: null,
        actualQty: null,
        finalPriceRMB: null,
        finalPriceUSD: null,
        profit: null,
        profitRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        product: {
          id: product.id,
          itemNo: product.itemNo,
          barcode: product.barcode,
          description: product.description,
          picture: product.images?.[0]?.url || null,
          cost: product.cost || 0,
          category: product.category,
          supplier: {
            name: product.supplier || ''
          },
          images: product.images || []
        },
        color: null,
        historyPrice: historyPrices.get(product.id) || null
      }))

      setItems(prev => [...prev, ...newItems])
    }
  }

  const handleImageClick = (item: QuotationItemType) => {
    console.log('点击图片时的商品数据:', {
      productId: item.productId,
      images: item.product.images,
      picture: item.product.picture
    })
    setSelectedProduct(item)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerId) {
      toast.error('请选择客户')
      return
    }

    if (items.length === 0) {
      toast.error('请添加商品')
      return
    }

    try {
      const quotationData = {
        customerId,
        manualNumber: isManualNumber ? manualNumber : undefined,
        exchangeRate,
        items: items.map(item => ({
          productId: item.productId,
          barcode: item.barcode,
          quantity: item.quantity,
          priceRMB: item.exwPriceRMB,
          priceUSD: item.exwPriceUSD,
          shipping: item.shipping,
          remark: item.remark,
          actualQty: item.actualQty,
          finalPriceRMB: item.finalPriceRMB,
          finalPriceUSD: item.finalPriceUSD,
          profit: item.profit,
          profitRate: item.profitRate,
          color: item.color
        })),
      }

      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotationData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '创建报价单失败')
      }

      const quotation = await response.json()
      toast.success('报价单已创建')
      router.push(`/quotations/${quotation.id}`)
    } catch (error) {
      console.error('创建报价单失败:', error)
      toast.error(error instanceof Error ? error.message : '创建报价单失败')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={isManualNumber}
              onCheckedChange={setIsManualNumber}
              id="number-mode"
            />
            <Label htmlFor="number-mode">
              {isManualNumber ? '手动输入编号' : '自动生成编号'}
            </Label>
          </div>

          {isManualNumber && (
            <div className="space-y-2">
              <Input
                type="text"
                value={manualNumber}
                onChange={(e) => setManualNumber(e.target.value)}
                maxLength={20}
                placeholder="请输入报价单编号"
                className="max-w-md"
              />
              <p className="text-xs text-gray-500">
                最大长度20字符，提交时将验证编号唯一性
              </p>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">新建报价单</h1>
          <div className="space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit">
              保存草稿
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <Label>选择客户</Label>
              <CustomerSelect
                customers={customers}
                value={customerId}
                onChange={handleCustomerSelect}
              />
            </div>
            <div>
              <Label>汇率</Label>
              <Input
                type="number"
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="w-32"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsProductSelectorOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          添加商品
        </button>

        <ProductSelectorDialog
          open={isProductSelectorOpen}
          onOpenChange={setIsProductSelectorOpen}
          onConfirm={handleProductsSelected}
        />

        <QuotationItems
          customerId={customerId}
          items={items}
          exchangeRate={exchangeRate}
          onItemsChangeAction={setItems}
          onImageClick={handleImageClick}
        />

        {/* 图片查看对话框 */}
        {selectedProduct && (
          <Dialog 
            open={!!selectedProduct} 
            onOpenChange={(open) => !open && setSelectedProduct(null)}
          >
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>商品图片</DialogTitle>
              </DialogHeader>
              <ImageGallery
                mainImage={selectedProduct.product.images?.find(img => img.isMain)?.url || selectedProduct.product.picture || null}
                additionalImages={selectedProduct.product.images?.filter(img => !img.isMain)?.map(img => img.url) || []}
                onMainImageChange={async () => {}}
                onAdditionalImagesChange={async () => {}}
                disabled={true}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* 重复商品提示对话框 */}
        <Dialog open={duplicateDialog.open} onOpenChange={(open) => setDuplicateDialog(prev => ({ ...prev, open }))}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>发现重复商品</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>以下商品已存在，已自动过滤：</p>
              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {duplicateDialog.products.map((product, index) => (
                  <div key={index} className="p-2 border rounded">
                    <div className="font-mono text-sm">{product.barcode}</div>
                    <div className="text-sm text-gray-600">{product.description}</div>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setDuplicateDialog(prev => ({ ...prev, open: false }))}>
                确定
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  )
} 