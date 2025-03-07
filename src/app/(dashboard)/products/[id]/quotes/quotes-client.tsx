"use client"

import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import type { Customer } from "@prisma/client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"

interface FormattedQuote {
  id: string
  quotationId: string
  quotationNumber: string
  customerId: string
  customer: Customer
  quantity: number
  priceRMB: number | null
  priceUSD: number | null
  updatedAt: Date
}

interface QuotesClientProps {
  quotes: FormattedQuote[]
}

export function QuotesClient({ quotes }: QuotesClientProps) {
  return (
    <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">产品报价历史</h2>
          <p className="text-muted-foreground">
            该产品的所有报价记录
          </p>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日期</TableHead>
              <TableHead>客户</TableHead>
              <TableHead>报价单号</TableHead>
              <TableHead>数量</TableHead>
              <TableHead>单价(RMB)</TableHead>
              <TableHead>单价(USD)</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell>{formatDate(quote.updatedAt)}</TableCell>
                <TableCell>{quote.customer.name}</TableCell>
                <TableCell>{quote.quotationNumber}</TableCell>
                <TableCell>{quote.quantity}</TableCell>
                <TableCell>¥{quote.priceRMB?.toFixed(2)}</TableCell>
                <TableCell>${quote.priceUSD?.toFixed(2)}</TableCell>
                <TableCell>
                  <Link href={`/quotations/${quote.quotationId}`}>
                    <Button variant="link" size="sm">
                      查看报价单
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
} 