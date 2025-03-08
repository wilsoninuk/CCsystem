"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuotationItems } from "../../new/quotation-items"
import { toast } from "sonner"
import type { Customer, Product, Quotation, ProductImage } from "@prisma/client"
import { QuotationItem as QuotationItemType } from "@/types/quotation"
import { ProductSelectorDialog } from "@/components/quotations/product-selector-dialog"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getProductsHistoryPrices } from "@/lib/services/price-history"
import { ImageGallery } from "@/app/(dashboard)/products/components/image-gallery"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { exportQuotationToExcel } from '@/lib/excel'

const queryClient = new QueryClient()

interface EditQuotationFormProps {
  quotation: Quotation & {
    customer: Customer
    items: QuotationItemType[]
  }
}

function EditQuotationFormContent({ quotation }: EditQuotationFormProps) {
  const router = useRouter()
  
  // 在初始化时确保 images 数据被正确处理
  const initialItems = useMemo(() => {
    console.log('初始化时的报价单数据:', {
      quotationId: quotation.id,
      items: quotation.items.map(item => ({
        productId: item.productId,
        product: item.product,
        imagesCount: item.product.images?.length,
        images: item.product.images
      }))
    })

    return quotation.items.map(item => {
      // 确保 product 对象的结构正确
      const processedProduct = {
        ...item.product,
        images: Array.isArray(item.product.images) ? item.product.images : []  // 确保 images 是数组
      }

      return {
        ...item,
        product: processedProduct
      }
    })
  }, [quotation.items])

  // 添加日志查看 items 状态初始化
  const [items, setItems] = useState<QuotationItemType[]>(() => {
    const initialState = initialItems
    console.log('items 状态初始化:', {
      itemsCount: initialState.length,
      items: initialState.map(item => ({
        productId: item.productId,
        images: item.product.images
      }))
    })
    return initialState
  })

  const [exchangeRate, setExchangeRate] = useState(quotation.exchangeRate)
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<QuotationItemType | null>(null)
  const [duplicateDialog, setDuplicateDialog] = useState<{
    open: boolean;
    products: Array<{ barcode: string; description: string }>;
  }>({
    open: false,
    products: []
  });

  const handleProductsSelected = (products: Array<{ product: Product & { images?: ProductImage[] }; quantity: number }>) => {
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
      // 获取所有新添加产品的历史价格
      const productIds = newProducts.map(p => p.product.id);
      getProductsHistoryPrices(productIds, quotation.customerId).then(historyPrices => {
        const newItems: QuotationItemType[] = newProducts.map(({ product, quantity }) => {
          // 先打印一下完整的商品数据，看看 category 是否存在
          console.log('添加商品时的完整数据:', {
            productId: product.id,
            product: product,
            category: product.category,
            images: product.images || [],
            picture: product.picture
          })

          // 确保 product 对象的结构与已有的产品数据结构一致
          const processedProduct = {
            id: product.id,
            itemNo: product.itemNo,
            barcode: product.barcode || '',
            description: product.description,
            picture: product.picture,
            cost: product.cost || 0,
            category: product.category,  // 确保包含 category
            supplier: {
              name: product.supplier || ''
            },
            images: product.images || []
          }

          return {
            id: '',
            quotationId: quotation.id,
            productId: product.id,
            barcode: product.barcode,
            serialNo: items.length + 1,
            quantity: quantity,
            exwPriceRMB: product.cost || 0,
            exwPriceUSD: (product.cost || 0) / exchangeRate,
            shipping: null,
            remark: null,
            actualQty: null,
            finalPriceRMB: null,
            finalPriceUSD: null,
            profit: null,
            profitRate: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            product: processedProduct,
            color: null,
            historyPrice: historyPrices.get(product.id) || {
              price: null,
              date: null,
              status: null,
              customerId: quotation.customerId
            }
          }
        })
        setItems(prev => [...prev, ...newItems])
      })
    } else {
      // 如果没有重复商品，直接添加所有商品
      const productIds = products.map(p => p.product.id);
      getProductsHistoryPrices(productIds, quotation.customerId).then(historyPrices => {
        const newItems: QuotationItemType[] = products.map(({ product, quantity }) => ({
          id: '',
          quotationId: quotation.id,
          productId: product.id,
          barcode: product.barcode,
          serialNo: items.length + 1,
          quantity: quantity,
          exwPriceRMB: product.cost || 0,
          exwPriceUSD: (product.cost || 0) / exchangeRate,
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
              name: product.supplier || ''
            },
            images: product.images || []
          },
          color: null,
          historyPrice: historyPrices.get(product.id) || {
            price: null,
            date: null,
            status: null,
            customerId: quotation.customerId
          }
        }))
        setItems(prev => [...prev, ...newItems])
      })
    }
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('请添加商品')
      return
    }

    // 添加日志查看要保存的数据
    console.log('准备保存的数据:', {
      itemsCount: items.length,
      items: items.map(item => ({
        productId: item.productId,
        images: item.product.images
      }))
    })

    try {
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
            color: item.color,
            product: {
              id: item.product.id,
              itemNo: item.product.itemNo,
              barcode: item.product.barcode,
              description: item.product.description,
              picture: item.product.picture,
              cost: item.product.cost,
              supplier: item.product.supplier,
              images: item.product.images  // 确保包含 images 数据
            }
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新报价单失败')
      }

      const result = await response.json()
      
      // 添加日志查看服务器返回的数据
      console.log('服务器返回的数据:', {
        itemsCount: result.items.length,
        items: result.items.map((item: any) => ({
          productId: item.productId,
          images: item.product.images
        }))
      })

      setItems(result.items)
      toast.success('报价单已更新')
      router.push(`/quotations/${quotation.id}`)
      router.refresh()
    } catch (error) {
      console.error('更新报价单失败:', error)
      toast.error(error instanceof Error ? error.message : '更新报价单失败')
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

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">编辑报价单</h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <Label>客户</Label>
            <div className="h-10 px-3 py-2 border rounded-md bg-muted">
              {quotation.customer.name}
            </div>
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

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => setIsProductSelectorOpen(true)}>
            添加商品
          </Button>
          <Button variant="outline" onClick={() => exportQuotationToExcel(items, `报价单_${quotation.number}.xlsx`)}>
            导出Excel
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            返回
          </Button>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </div>
      </div>

      <ProductSelectorDialog
        open={isProductSelectorOpen}
        onOpenChange={setIsProductSelectorOpen}
        onConfirm={handleProductsSelected}
      />

      <QuotationItems
        customerId={quotation.customerId}
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
  )
}

export function EditQuotationForm(props: EditQuotationFormProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <EditQuotationFormContent {...props} />
    </QueryClientProvider>
  )
} 