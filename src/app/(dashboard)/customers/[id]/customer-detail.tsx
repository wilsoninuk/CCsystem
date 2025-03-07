"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Customer, Quotation } from "@prisma/client"

interface CustomerDetailProps {
  customer: Customer & {
    quotations: Quotation[]
  }
}

export function CustomerDetail({ customer }: CustomerDetailProps) {
  const router = useRouter()

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">客户详情</h1>
          <p className="text-muted-foreground">
            {customer.code} - {customer.name}
          </p>
        </div>
        <div>
          <Button 
            variant="outline"
            onClick={() => router.push(`/customers/${customer.id}/edit`)}
          >
            编辑
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">基本信息</h2>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-24 font-medium">客户编号:</dt>
              <dd>{customer.code}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">客户名称:</dt>
              <dd>{customer.name}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">PI地址:</dt>
              <dd>{customer.piAddress}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">发货人:</dt>
              <dd>{customer.piShipper}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">交易信息</h2>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-24 font-medium">付款方式:</dt>
              <dd>{customer.paymentMethod}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">船运方式:</dt>
              <dd>{customer.shippingMethod}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">默认货币:</dt>
              <dd>{customer.currency}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">汇率:</dt>
              <dd>{customer.exchangeRate?.toFixed(4) || '-'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">最近报价单</h2>
        {customer.quotations.length > 0 ? (
          <ul className="space-y-2">
            {customer.quotations.map(quote => (
              <li 
                key={quote.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{quote.number}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(quote.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    ${quote.totalAmountUSD.toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/quotations/${quote.id}`)}
                  >
                    查看
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">暂无报价单</p>
        )}
      </div>
    </div>
  )
} 