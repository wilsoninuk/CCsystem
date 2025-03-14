import { prisma } from "@/lib/db"
import { QuotationPrint } from "./quotation-print"
import { notFound } from "next/navigation"
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QuotationPrintPage({ 
  params: { id } 
}: { 
  params: { id: string } 
}) {
  // 禁用缓存，确保每次访问都获取最新数据
  noStore()
  
  try {
    console.log('Server: 打印页面 - 开始加载报价单数据', id)
    
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                itemNo: true,
                description: true,
                material: true,
                color: true,
                productSize: true,
              }
            }
          }
        }
      }
    })

    if (!quotation) {
      console.log('Server: 打印页面 - 报价单不存在', id)
      notFound()
    }

    console.log('Server: 打印页面 - 成功加载报价单数据', {
      id: quotation.id,
      items: quotation.items.length
    })

    return <QuotationPrint quotation={quotation} />
  } catch (error) {
    console.error('加载报价单失败:', error)
    notFound()
  }
} 