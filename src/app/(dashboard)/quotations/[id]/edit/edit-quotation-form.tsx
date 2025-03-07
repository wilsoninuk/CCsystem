"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QuotationItems } from "../../new/quotation-items"
import { toast } from "sonner"
import type { Customer, Product, Quotation } from "@prisma/client"
import { QuotationItem as QuotationItemType } from "@/types/quotation"
import { ProductSelectorDialog } from "@/components/quotations/product-selector-dialog"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { getProductsHistoryPrices } from "@/lib/services/price-history"

const queryClient = new QueryClient()

interface EditQuotationFormProps {
  quotation: Quotation & {
    customer: Customer
    items: QuotationItemType[]
  }
}

function EditQuotationFormContent({ quotation }: EditQuotationFormProps) {
  const router = useRouter()
  const [exchangeRate, setExchangeRate] = useState(quotation.exchangeRate)
  const [items, setItems] = useState<QuotationItemType[]>(quotation.items)
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)

  const handleProductsSelected = async (products: Array<{ product: Product; quantity: number }>) => {
    // 获取所有新添加产品的历史价格
    const productIds = products.map(p => p.product.id)
    const historyPrices = await getProductsHistoryPrices(productIds, quotation.customerId)

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
        picture: product.images?.[0]?.url || null,
        cost: product.cost || 0,
        supplier: {
          name: product.supplier || ''
        }
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
  }

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('请添加商品')
      return
    }

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
            color: item.color
          }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新报价单失败')
      }

      const result = await response.json()
      setItems(result.items)
      toast.success('报价单已更新')
      router.push(`/quotations/${quotation.id}`)
      router.refresh()
    } catch (error) {
      console.error('更新报价单失败:', error)
      toast.error(error instanceof Error ? error.message : '更新报价单失败')
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">编辑报价单</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
            保存
          </Button>
        </div>
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
        customerId={quotation.customerId}
        items={items}
        exchangeRate={exchangeRate}
        onItemsChangeAction={setItems}
      />
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