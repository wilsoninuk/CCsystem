import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

/**
 * 获取报价单列表
 * 此API路由用于客户端获取最新的报价单数据，支持客户端刷新机制
 */
export async function GET(request: Request) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    console.log('API: 获取报价单列表 - 开始查询数据库')
    
    // 获取所有报价单
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

    console.log(`API: 获取报价单列表 - 成功获取 ${quotations.length} 条记录`)
    
    // 设置缓存控制头，防止浏览器缓存
    return new NextResponse(JSON.stringify(quotations), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Surrogate-Control': 'no-store',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Vary': '*'
      }
    })
  } catch (error) {
    console.error('获取报价单列表失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取报价单列表失败' },
      { status: 500 }
    )
  }
} 