"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { formatDate } from "@/lib/utils"
import { FileText, FileDown } from "lucide-react"
import type { Quotation, QuotationItem, Customer, Product, ProductImage as ProductImageType, User, QuotationRevision } from "@prisma/client"
import { ProductImage } from "@/components/ui/image"
import { exportQuotationDetail } from "@/lib/excel"

interface QuotationDetailProps {
  quotation: Quotation & {
    customer: Customer
    user: User
    items: (QuotationItem & {
      product: Product & {
        images: ProductImageType[]
      }
    })[]
    revisions: QuotationRevision[]
  }
}

export function QuotationDetail({ quotation }: QuotationDetailProps) {
  const router = useRouter()

  const handleExport = async () => {
    try {
      await exportQuotationDetail(quotation)
    } catch (error) {
      console.error('导出Excel失败:', error)
    }
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">报价单详情</h1>
          <p className="text-muted-foreground">
            编号: {quotation.number} | 状态: {quotation.status} | 
            创建时间: {formatDate(quotation.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            onClick={() => router.push(`/quotations/${quotation.id}/print`)}
          >
            <FileText className="mr-2 h-4 w-4" />
            打印
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <FileDown className="h-4 w-4 mr-2" />
            导出Excel
          </Button>
        </div>
      </div>

      {/* 客户信息 */}
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">客户信息</h2>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-24 font-medium">客户名称:</dt>
              <dd>{quotation.customerName}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">PI地址:</dt>
              <dd>{quotation.piAddress}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">发货人:</dt>
              <dd>{quotation.piShipper}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">付款方式:</dt>
              <dd>{quotation.paymentMethod}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">船运方式:</dt>
              <dd>{quotation.shippingMethod}</dd>
            </div>
          </dl>
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-4">报价信息</h2>
          <dl className="space-y-2">
            <div className="flex">
              <dt className="w-24 font-medium">汇率:</dt>
              <dd>{quotation.exchangeRate}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">总金额(RMB):</dt>
              <dd>¥{quotation.totalAmountRMB.toFixed(2)}</dd>
            </div>
            <div className="flex">
              <dt className="w-24 font-medium">总金额(USD):</dt>
              <dd>${quotation.totalAmountUSD.toFixed(2)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* 商品列表 */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>序号</TableHead>
            <TableHead>图片</TableHead>
            <TableHead>商品编号</TableHead>
            <TableHead>条形码</TableHead>
            <TableHead>描述</TableHead>
            <TableHead>数量</TableHead>
            <TableHead>单价(RMB)</TableHead>
            <TableHead>单价(USD)</TableHead>
            <TableHead>总价(RMB)</TableHead>
            <TableHead>总价(USD)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {quotation.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.serialNo}</TableCell>
              <TableCell>
                <div className="relative w-16 h-16">
                  <ProductImage
                    src={item.product.images[0]?.url}
                    alt={item.product.description}
                  />
                </div>
              </TableCell>
              <TableCell>{item.product.itemNo}</TableCell>
              <TableCell>{item.barcode}</TableCell>
              <TableCell>{item.product.description}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>¥{item.exwPriceRMB.toFixed(2)}</TableCell>
              <TableCell>${item.exwPriceUSD.toFixed(2)}</TableCell>
              <TableCell>¥{(item.exwPriceRMB * item.quantity).toFixed(2)}</TableCell>
              <TableCell>${(item.exwPriceUSD * item.quantity).toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={5} className="text-right font-bold">
              总计:
            </TableCell>
            <TableCell className="font-bold">
              {quotation.items.reduce((sum, item) => sum + item.quantity, 0)}
            </TableCell>
            <TableCell colSpan={2} className="text-right font-bold" />
            <TableCell className="font-bold">
              ¥{quotation.totalAmountRMB.toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${quotation.totalAmountUSD.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
} 