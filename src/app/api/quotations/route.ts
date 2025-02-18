import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"

interface CreateQuotationData {
  customerId: string
  items: Array<{
    productId: string
    barcode: string
    quantity: number
    priceRMB: number
    priceUSD: number
  }>
  exchangeRate: number
  status?: 'draft' | 'official'
}

export async function POST(req: Request) {
  try {
    const data = await req.json() as CreateQuotationData
    const { customerId, items, exchangeRate, status } = data

    // 1. 获取客户信息
    const customer = await prisma.customer.findUnique({
      where: { id: customerId }
    })

    if (!customer) {
      throw new Error('客户不存在')
    }

    // 2. 计算总金额
    const totalAmountRMB = items.reduce((sum, item) => sum + item.priceRMB * item.quantity, 0)
    const totalAmountUSD = items.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0)

    // 3. 生成报价单号
    const date = new Date()
    const number = `${customer.code}-${date.getFullYear().toString().slice(-2)}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`

    // 4. 创建报价单
    const quotationData: Prisma.QuotationCreateInput = {
      number,
      status: status || 'draft',
      exchangeRate,
      totalAmountRMB,
      totalAmountUSD,
      customer: {
        connect: {
          id: customerId
        }
      },
      user: {
        connect: {
          email: 'system@example.com'
        }
      },
      customerName: customer.name,
      piAddress: customer.piAddress,
      piShipper: customer.piShipper,
      paymentMethod: customer.paymentMethod,
      shippingMethod: customer.shippingMethod,
      items: {
        create: items.map((item, index) => ({
          serialNo: index + 1,
          product: {
            connect: {
              id: item.productId
            }
          },
          barcode: item.barcode,
          quantity: item.quantity,
          exwPriceRMB: item.priceRMB,
          exwPriceUSD: item.priceUSD
        }))
      }
    }

    const quotation = await prisma.quotation.create({
      data: quotationData
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('创建报价单失败:', error)
    return NextResponse.json(
      { error: '创建报价单失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 