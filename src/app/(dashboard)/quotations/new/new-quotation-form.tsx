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

interface NewQuotationFormProps {
  customers: Pick<Customer, "id" | "code" | "name" | "exchangeRate">[]
}

export function NewQuotationForm({ customers }: NewQuotationFormProps) {
  const router = useRouter()
  const [customerId, setCustomerId] = useState("")
  const [exchangeRate, setExchangeRate] = useState(7.2)
  const [items, setItems] = useState<QuotationItemType[]>([])

  const handleAddProduct = (product: Pick<Product, "id" | "itemNo" | "barcode" | "description" | "picture" | "cost"> & {
    supplier: { name: string }
  }) => {
    const newItem: QuotationItemType = {
      id: '',
      quotationId: '',
      productId: product.id,
      barcode: product.barcode,
      serialNo: items.length + 1,
      quantity: 1,
      exwPriceRMB: product.cost,
      exwPriceUSD: product.cost / exchangeRate,
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
      color: null
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

  const handleSubmit = async () => {
    if (!customerId) {
      toast.error('请选择客户')
      return
    }

    if (items.length === 0) {
      toast.error('请添加商品')
      return
    }

    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          exchangeRate,
          items: items.map(item => ({
            productId: item.productId,
            barcode: item.barcode,
            quantity: item.quantity,
            priceRMB: item.exwPriceRMB,
            priceUSD: item.exwPriceUSD
          }))
        })
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
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">新建报价单</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSubmit}>
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

      <ProductSelector onSelect={handleAddProduct} />

      <QuotationItems
        customerId={customerId}
        items={items}
        exchangeRate={exchangeRate}
        onItemsChangeAction={setItems}
      />
    </div>
  )
} 