"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { ProductSelector } from "./product-selector"
import type { Customer, CustomerProductPrice, Product } from "@prisma/client"

interface NewQuoteFormProps {
  customer: Customer & {
    productPrices: (CustomerProductPrice & {
      product: Pick<Product, "id" | "itemNo" | "barcode" | "description" | "picture" | "cost">
    })[]
  }
}

interface QuoteItem {
  productId: string
  quantity: number
  priceRMB: number
  priceUSD: number
}

export function NewQuoteForm({ customer }: NewQuoteFormProps) {
  const router = useRouter()
  const [items, setItems] = useState<QuoteItem[]>([])
  const [exchangeRate, setExchangeRate] = useState(customer.exchangeRate || 7.2)

  // 添加商品
  const handleAddProduct = (product: Product) => {
    // 查找历史报价
    const historicalPrice = customer.productPrices.find(
      p => p.product.id === product.id
    )

    setItems(prev => [...prev, {
      productId: product.id,
      quantity: 1,
      priceRMB: historicalPrice?.price || 0,
      priceUSD: historicalPrice ? historicalPrice.price / exchangeRate : 0
    }])
  }

  // 更新数量
  const handleQuantityChange = (index: number, quantity: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ))
  }

  // 更新人民币价格
  const handleRMBPriceChange = (index: number, price: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { 
        ...item, 
        priceRMB: price,
        priceUSD: price / exchangeRate 
      } : item
    ))
  }

  // 更新美元价格
  const handleUSDPriceChange = (index: number, price: number) => {
    setItems(prev => prev.map((item, i) => 
      i === index ? { 
        ...item, 
        priceUSD: price,
        priceRMB: price * exchangeRate 
      } : item
    ))
  }

  // 提交报价单
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          items,
          exchangeRate
        })
      })

      if (!response.ok) throw new Error('创建报价单失败')

      const quotation = await response.json()
      router.push(`/quotations/${quotation.id}`)
    } catch (error) {
      console.error('创建报价单失败:', error)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">新建报价单</h2>
          <p className="text-muted-foreground">客户: {customer.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label>汇率:</Label>
            <Input
              type="number"
              value={exchangeRate}
              onChange={e => setExchangeRate(Number(e.target.value))}
              className="w-24"
            />
          </div>
          <Button onClick={handleSubmit}>
            创建报价单
          </Button>
        </div>
      </div>

      <ProductSelector onSelect={handleAddProduct} />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item No.</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead>EXW Price(RMB)</TableHead>
            <TableHead>EXW Price(USD)</TableHead>
            <TableHead>Total(RMB)</TableHead>
            <TableHead>Total(USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              {/* ... 表格行内容 ... */}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 