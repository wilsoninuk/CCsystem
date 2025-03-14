import { prisma } from "@/lib/db"
import { QuotationList } from "./quotation-list"
import { unstable_noStore as noStore } from 'next/cache'
import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function QuotationsPage() {
  // 禁用缓存，确保每次访问都获取最新数据
  noStore()
  
  try {
    // 获取请求头，用于调试
    const headersList = headers()
    
    console.log('Server: 报价单页面加载 - 请求信息', {
      timestamp: new Date().toISOString()
    })
    
    console.log('Server: 开始查询报价单数据')
    
    const quotations = await prisma.quotation.findMany({
      include: {
        customer: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Server: 成功获取 ${quotations.length} 条报价单数据`)
    
    return <QuotationList quotations={quotations} />
  } catch (error) {
    console.error('Server: 获取报价单数据失败', error)
    throw error
  }
} 