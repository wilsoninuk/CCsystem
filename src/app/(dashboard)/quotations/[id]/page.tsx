import { prisma } from "@/lib/db"
import { QuotationDetail } from "./quotation-detail"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { StatusActions } from "./status-actions"
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface PageProps {
  params: { id: string }
}

export default async function QuotationPage(props: PageProps) {
  // 禁用缓存，确保每次访问都获取最新数据
  noStore()
  
  try {
    const { id } = await Promise.resolve(props.params)
    
    console.log('Server: 详情页面 - 开始加载报价单数据', id)
    
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: id
      },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: {
                    isMain: true
                  }
                }
              }
            }
          }
        },
        revisions: {
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!quotation) {
      console.log('Server: 详情页面 - 报价单不存在', id)
      notFound()
    }

    console.log('Server: 详情页面 - 成功加载报价单数据', {
      id: quotation.id,
      items: quotation.items.length
    })

    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">报价单详情</h1>
            <div className="text-sm text-muted-foreground">
              {quotation.number}
            </div>
            <Badge variant={quotation.status === 'official' ? 'default' : 'secondary'}>
              {quotation.status === 'official' ? '正式' : '草稿'}
            </Badge>
          </div>
          <StatusActions 
            id={id} 
            status={quotation.status} 
            shippingDate={quotation.shippingDate}
          />
        </div>
        <QuotationDetail quotation={quotation} />
      </div>
    )
  } catch (error) {
    console.error('加载报价单失败:', error)
    notFound()
  }
} 