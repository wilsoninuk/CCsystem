import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { convertToBeijingMidnight } from "@/lib/utils"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customerId = params.id
    console.log('开始同步客户历史记录，客户ID:', customerId)

    // 先检查所有报价单的状态
    const allQuotations = await prisma.quotation.findMany({
      where: {
        customerId: customerId,
      },
      select: {
        id: true,
        number: true,
        status: true,
        items: {
          select: {
            quantity: true,
            exwPriceRMB: true,
            exwPriceUSD: true,
            actualQty: true,
            finalPriceRMB: true,
            finalPriceUSD: true
          }
        }
      }
    })

    console.log('客户所有报价单状态:', allQuotations.map(q => ({
      number: q.number,
      status: q.status,
      items: q.items.map(item => ({
        quantity: item.quantity,
        exwPriceRMB: item.exwPriceRMB,
        exwPriceUSD: item.exwPriceUSD,
        actualQty: item.actualQty,
        finalPriceRMB: item.finalPriceRMB,
        finalPriceUSD: item.finalPriceUSD
      }))
    })))

    // 获取客户所有已出货的报价单及其商品信息
    const quotations = await prisma.quotation.findMany({
      where: {
        customerId: customerId,
        status: 'ci'
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
        createdAt: 'desc'
      }
    })

    console.log('找到的 ci 状态报价单数量:', quotations.length)
    quotations.forEach(q => {
      console.log('报价单详情:', {
        number: q.number,
        itemCount: q.items.length,
        shippingDate: q.shippingDate,
        items: q.items.map(item => ({
          itemNo: item.product.itemNo,
          barcode: item.product.barcode,
          quantity: item.quantity,
          exwPriceRMB: item.exwPriceRMB,
          exwPriceUSD: item.exwPriceUSD,
          actualQty: item.actualQty,
          finalPriceRMB: item.finalPriceRMB,
          finalPriceUSD: item.finalPriceUSD
        }))
      })
    })

    // 删除现有的历史记录
    const { count: deletedCount } = await prisma.customerProductHistory.deleteMany({
      where: {
        customerId: customerId
      }
    })

    console.log('已删除历史记录数量:', deletedCount)

    // 准备新的历史记录
    const historyRecords = quotations.flatMap(quotation => 
      quotation.items
        .filter(item => 
          item.product && 
          typeof item.quantity === 'number' && 
          item.quantity > 0 && 
          (item.exwPriceRMB > 0 || item.exwPriceUSD > 0)
        )
        .map(item => {
          // 将日期转换为北京时间午夜时分
          const shippedAt = quotation.shippingDate || quotation.createdAt
          const beijingDate = convertToBeijingMidnight(shippedAt)

          return {
            customerId: customerId,
            productId: item.product.id,
            quantity: item.quantity,
            priceRMB: item.exwPriceRMB || 0,
            priceUSD: item.exwPriceUSD || 0,
            shippedAt: beijingDate,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })
    )

    console.log('准备创建的历史记录数量:', historyRecords.length)
    historyRecords.forEach(record => {
      console.log('历史记录详情:', {
        productId: record.productId,
        quantity: record.quantity,
        priceRMB: record.priceRMB,
        priceUSD: record.priceUSD,
        shippedAt: record.shippedAt
      })
    })

    if (historyRecords.length === 0) {
      console.log('没有找到有效的历史记录数据')
      return NextResponse.json({
        message: '没有找到有效的历史记录数据',
        quotations: quotations.map(q => q.number)
      })
    }

    // 批量创建新的历史记录
    const result = await prisma.customerProductHistory.createMany({
      data: historyRecords
    })

    console.log('同步完成，创建的记录数:', result.count)

    return NextResponse.json({
      deletedCount,
      createdCount: result.count,
      quotations: quotations.map(q => q.number)
    })
  } catch (error) {
    console.error('同步历史记录失败:', error)
    return NextResponse.json(
      { error: '同步历史记录失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 