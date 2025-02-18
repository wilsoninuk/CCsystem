"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ProductSelector } from "../../new/product-selector"
import { QuotationItems } from "../../new/quotation-items"
import { toast } from "sonner"
import type { Quotation, QuotationItem, Customer, Product } from "@prisma/client"
import { QuotationItem as QuotationItemType } from "@/types/quotation"

interface EditQuotationFormProps {
  quotation: Quotation & {
    customer: Customer
    items: (QuotationItem & {
      product: {
        id: string
        itemNo: string
        barcode: string
        description: string
        picture: string | null
        cost: number
        supplier: {
          name: string
        }
      }
    })[]
  }
}

export function EditQuotationForm({ quotation }: EditQuotationFormProps) {
  const router = useRouter()

  // 添加类型检查函数
  const isValidColor = (color: string | null): color is "blue" | "purple" | "pink" | null => {
    return color === null || ["blue", "purple", "pink"].includes(color)
  }

  const [items, setItems] = useState<QuotationItemType[]>(
    quotation.items.map(item => ({
      ...item,
      product: {
        ...item.product,
        supplier: item.product.supplier || { name: '' }
      },
      color: isValidColor(item.color) ? item.color : null  // 使用类型检查
    }))
  )
  const [exchangeRate, setExchangeRate] = useState(quotation.exchangeRate)

  const handleAddProduct = (product: Pick<Product, "id" | "itemNo" | "barcode" | "description" | "picture" | "cost"> & {
    supplier: { name: string }
  }) => {
    const newItem: QuotationItemType = {
      id: '',
      quotationId: quotation.id,
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
        supplier: product.supplier
      }
    }
    
    setItems(prev => [...prev, newItem])
  }

  // 保存报价单
  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/quotations/${quotation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchangeRate,
          items: items.map(item => {
            const data = {
              id: item.id,
              productId: item.productId,
              barcode: item.barcode,
              serialNo: item.serialNo,
              quantity: item.quantity,
              exwPriceRMB: item.exwPriceRMB,
              exwPriceUSD: item.exwPriceUSD,
              actualQty: item.actualQty,
              finalPriceRMB: item.finalPriceRMB,
              finalPriceUSD: item.finalPriceUSD,
              shipping: item.shipping,
              profit: item.profit,
              profitRate: item.profitRate,
              remark: item.remark
            }

            // 只有当 color 有值时才添加
            if (item.color) {
              Object.assign(data, { color: item.color })
            }

            return data
          })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '保存报价单失败')
      }

      toast.success('报价单已保存')
      router.push(`/quotations/${quotation.id}`)
      router.refresh()
    } catch (error) {
      console.error('保存报价单失败:', error)
      toast.error(error instanceof Error ? error.message : '保存报价单失败')
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">编辑报价单</h1>
          <p className="text-muted-foreground">
            编号: {quotation.number} | 客户: {quotation.customerName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
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
        customerId={quotation.customerId}
        items={items}
        exchangeRate={exchangeRate}
        onItemsChangeAction={(newItems) => {
          setItems(newItems.map(item => ({
            ...item,
            exwPriceRMB: item.exwPriceRMB || item.product.cost,
            exwPriceUSD: item.exwPriceUSD || item.product.cost / exchangeRate,
          })))
        }}
      />
    </div>
  )
} 