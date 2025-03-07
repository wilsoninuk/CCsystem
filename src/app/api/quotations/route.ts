import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"

interface CreateQuotationData {
  customerId: string
  manualNumber?: string
  items: Array<{
    productId: string
    barcode: string
    quantity: number
    priceRMB: number
    priceUSD: number
    shipping?: string
    remark?: string
    actualQty?: number
    finalPriceRMB?: number
    finalPriceUSD?: number
    profit?: number
    profitRate?: number
    color?: string
  }>
  exchangeRate: number
  status?: 'draft' | 'official'
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const data = await request.json()

    // 1. 获取客户信息
    const customer = await prisma.customer.findUnique({
      where: { id: data.customerId },
      select: {
        id: true,
        name: true,
        paymentMethod: true,
        piAddress: true,
        piShipper: true,
        shippingMethod: true
      }
    })

    if (!customer) {
      return NextResponse.json(
        { error: "客户不存在" },
        { status: 404 }
      )
    }

    // 2. 生成报价单编号
    let quotationNumber: string

    if (data.manualNumber) {
      // 验证手动输入的编号唯一性
      const existingQuotation = await prisma.quotation.findUnique({
        where: {
          number: data.manualNumber
        }
      })

      if (existingQuotation) {
        return NextResponse.json(
          { error: "报价单编号已存在" },
          { status: 400 }
        )
      }

      quotationNumber = data.manualNumber
    } else {
      // 原有的自动生成编号逻辑
      const today = new Date()
      const dateStr = today.toISOString().slice(2, 10).replace(/-/g, '')
      const latestQuotation = await prisma.quotation.findFirst({
        where: {
          number: {
            startsWith: `QT${dateStr}`
          }
        },
        orderBy: {
          number: 'desc'
        }
      })

      if (latestQuotation) {
        const lastNumber = parseInt(latestQuotation.number.slice(-4))
        quotationNumber = `QT${dateStr}${String(lastNumber + 1).padStart(4, '0')}`
      } else {
        quotationNumber = `QT${dateStr}0001`
      }
    }

    // 3. 计算总金额
    let totalAmountRMB = 0
    let totalAmountUSD = 0
    data.items.forEach((item: any) => {
      const itemTotalRMB = item.priceRMB * item.quantity
      const itemTotalUSD = item.priceUSD * item.quantity
      totalAmountRMB += itemTotalRMB
      totalAmountUSD += itemTotalUSD
    })

    // 4. 创建报价单
    const quotation = await prisma.quotation.create({
      data: {
        number: quotationNumber,
        customerName: customer.name,
        exchangeRate: data.exchangeRate,
        status: data.status || 'draft',
        paymentMethod: customer.paymentMethod || 'T/T',
        piAddress: customer.piAddress || '',
        shippingMethod: customer.shippingMethod || '',
        piShipper: customer.piShipper || '',
        totalAmountRMB: totalAmountRMB,
        totalAmountUSD: totalAmountUSD,
        customer: {
          connect: {
            id: data.customerId
          }
        },
        user: {
          connect: {
            id: session.user.id
          }
        },
        items: {
          create: data.items.map((item: any, index: number) => ({
            serialNo: index + 1,
            productId: item.productId,
            barcode: item.barcode,
            quantity: item.quantity,
            exwPriceRMB: item.priceRMB,
            exwPriceUSD: item.priceUSD,
            shipping: item.shipping,
            remark: item.remark,
            actualQty: item.actualQty,
            finalPriceRMB: item.finalPriceRMB,
            finalPriceUSD: item.finalPriceUSD,
            profit: item.profit,
            profitRate: item.profitRate,
            color: item.color
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isMain: true }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('创建报价单失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建报价单失败' },
      { status: 500 }
    )
  }
} 