"use client"

import { formatDate } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { Quotation } from "@prisma/client"
import Link from "next/link"

interface QuotationHistoryProps {
  quotations: Quotation[]
}

const statusMap: Record<string, { label: string; variant: "default" | "outline" | "secondary" | "destructive" }> = {
  draft: { label: "草稿", variant: "outline" },
  pending: { label: "待确认", variant: "secondary" },
  confirmed: { label: "已确认", variant: "default" },
  ci: { label: "已出货", variant: "default" },
  cancelled: { label: "已取消", variant: "destructive" },
}

export function QuotationHistory({ quotations }: QuotationHistoryProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">报价记录</h2>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>报价单号</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>总金额(RMB)</TableHead>
            <TableHead>总金额(USD)</TableHead>
            <TableHead>汇率</TableHead>
            <TableHead>出货时间</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead>备注</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotations.map((quotation) => (
            <TableRow key={quotation.id}>
              <TableCell>
                <Link 
                  href={`/quotations/${quotation.id}`}
                  className="text-primary hover:underline"
                >
                  {quotation.number}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant={statusMap[quotation.status]?.variant || "outline"}>
                  {statusMap[quotation.status]?.label || quotation.status}
                </Badge>
              </TableCell>
              <TableCell>¥{quotation.totalAmountRMB.toFixed(2)}</TableCell>
              <TableCell>${quotation.totalAmountUSD.toFixed(2)}</TableCell>
              <TableCell>{quotation.exchangeRate}</TableCell>
              <TableCell>{quotation.shippingDate ? formatDate(quotation.shippingDate) : "-"}</TableCell>
              <TableCell>{formatDate(quotation.createdAt)}</TableCell>
              <TableCell>{quotation.remark || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 