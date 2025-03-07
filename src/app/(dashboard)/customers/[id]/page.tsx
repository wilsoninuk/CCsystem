import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProductHistory } from "./product-history"
import { QuotationHistory } from "./quotation-history"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SyncHistoryButton } from "./sync-history-button"

interface CustomerDetailsPageProps {
  params: Promise<{
    id: string
  }> | {
    id: string
  }
}

export default async function CustomerDetailsPage({
  params,
}: CustomerDetailsPageProps) {
  // 确保 params 是已解析的
  const resolvedParams = await Promise.resolve(params)
  const customerId = resolvedParams.id

  // 确保 customerId 是有效的
  if (!customerId) {
    notFound()
  }

  // 获取客户信息和历史记录
  const customer = await prisma.customer.findUnique({
    where: {
      id: customerId,
    },
    include: {
      productHistory: {
        include: {
          product: {
            include: {
              images: true
            }
          }
        },
        orderBy: {
          shippedAt: "desc",
        },
      },
      quotations: {
        where: {
          OR: [
            { status: 'ci' },
            { status: 'completed' }
          ]
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  console.log('客户报价单状态:', customer.quotations.map(q => ({
    number: q.number,
    status: q.status,
    itemCount: q.items.length,
    items: q.items.map(item => ({
      quantity: item.quantity,
      exwPriceRMB: item.exwPriceRMB,
      exwPriceUSD: item.exwPriceUSD,
      actualQty: item.actualQty,
      finalPriceRMB: item.finalPriceRMB,
      finalPriceUSD: item.finalPriceUSD
    }))
  })))

  // 创建一个映射表来存储商品和报价单的关系
  const productQuotationMap = new Map()
  
  customer.quotations.forEach(quotation => {
    quotation.items.forEach(item => {
      if (item.product && typeof item.quantity === 'number' && item.quantity > 0) {
        const key = `${item.productId}_${item.quantity}_${item.exwPriceRMB || 0}_${item.exwPriceUSD || 0}`
        productQuotationMap.set(key, {
          quotationId: quotation.id,
          quotationNumber: quotation.number
        })
      }
    })
  })

  // 为每个历史记录找到对应的报价单
  const productHistoryWithQuotation = customer.productHistory.map(historyItem => {
    const key = `${historyItem.productId}_${historyItem.quantity}_${historyItem.priceRMB}_${historyItem.priceUSD}`
    const quotationInfo = productQuotationMap.get(key)

    return {
      ...historyItem,
      quotationNumber: quotationInfo?.quotationNumber || undefined,
      quotationId: quotationInfo?.quotationId || undefined
    }
  })

  console.log('历史记录数量:', productHistoryWithQuotation.length)
  console.log('报价单数量:', customer.quotations.length)

  return (
    <div className="container mx-auto py-6 px-2 sm:px-4 lg:px-6 max-w-[1920px]">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">客户详情</h1>
        <SyncHistoryButton customerId={customerId} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">基本信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">客户编号</span>
                <span>{customer.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">客户名称</span>
                <span>{customer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态</span>
                <Badge variant={customer.isActive ? "default" : "destructive"}>
                  {customer.isActive ? "活跃" : "停用"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">付款信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">币种</span>
                <span>{customer.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">汇率</span>
                <span>{customer.exchangeRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">付款方式</span>
                <span>{customer.paymentMethod}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">出货信息</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">出货地址</span>
                <span>{customer.piAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">出货方式</span>
                <span>{customer.shippingMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">承运人</span>
                <span>{customer.piShipper}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="shipping" className="space-y-4">
        <TabsList>
          <TabsTrigger value="shipping">出货记录</TabsTrigger>
          <TabsTrigger value="quotation">报价记录</TabsTrigger>
        </TabsList>
        <TabsContent value="shipping" className="space-y-4">
          <ProductHistory history={productHistoryWithQuotation} />
        </TabsContent>
        <TabsContent value="quotation" className="space-y-4">
          <QuotationHistory quotations={customer.quotations} />
        </TabsContent>
      </Tabs>
    </div>
  )
} 