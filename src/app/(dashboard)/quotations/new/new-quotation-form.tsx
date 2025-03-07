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

interface NewQuotationFormProps {
  customers: Pick<Customer, "id" | "code" | "name" | "exchangeRate">[]
}

export function NewQuotationForm({ customers }: NewQuotationFormProps) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [exchangeRate, setExchangeRate] = useState(7.2)
  const [items, setItems] = useState<QuotationItemType[]>([])
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false)
  const [isManualNumber, setIsManualNumber] = useState(false)
  const [manualNumber, setManualNumber] = useState('')

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

  const handleProductsSelected = async (products: Array<{ product: Product; quantity: number }>) => {
    // 获取所有产品的历史价格
    const productIds = products.map(p => p.product.id)
    const historyPrices = customerId ? 
      await getProductsHistoryPrices(productIds, customerId) : 
      new Map()

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
        supplier: {
          name: product.supplier
        }
      },
      color: null,
      historyPrice: historyPrices.get(product.id) || null
    }))

    setItems(prev => [...prev, ...newItems])
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
        />
      </div>
    </form>
  )
} 