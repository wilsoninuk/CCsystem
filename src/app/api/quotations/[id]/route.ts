import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { exchangeRate, items } = await request.json()

    // 更新报价单
    const quotation = await prisma.quotation.update({
      where: { 
        id: params.id 
      },
      data: {
        exchangeRate,
        items: {
          deleteMany: {},
          create: items.map((item: any) => ({
            productId: item.productId,
            barcode: item.barcode,
            serialNo: item.serialNo,
            quantity: item.quantity,
            exwPriceRMB: item.exwPriceRMB,
            exwPriceUSD: item.exwPriceUSD,
            shipping: item.shipping || null,
            remark: item.remark || null,
            actualQty: item.actualQty || null,
            finalPriceRMB: item.finalPriceRMB || null,
            finalPriceUSD: item.finalPriceUSD || null,
            profit: item.profit || null,
            profitRate: item.profitRate || null,
            color: item.color || null
          }))
        }
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
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('更新报价单失败:', error)
    return NextResponse.json(
      { error: '更新报价单失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { password } = await request.json()

    // 验证密码
    if (password !== 'dehuijixiang') {
      return NextResponse.json(
        { message: '密码错误' },
        { status: 403 }
      )
    }

    // 使用事务来确保原子性
    await prisma.$transaction(async (tx) => {
      // 先检查报价单是否存在
      const quotation = await tx.quotation.findUnique({
        where: { id: params.id },
        include: {
          items: true,
          revisions: true
        }
      })

      if (!quotation) {
        throw new Error('报价单不存在')
      }

      // 按顺序删除所有关联数据
      if (quotation.revisions?.length > 0) {
        await tx.quotationRevision.deleteMany({
          where: { quotationId: params.id }
        })
      }

      // 删除报价单项目
      await tx.quotationItem.deleteMany({
        where: { quotationId: params.id }
      })

      // 最后删除报价单
      await tx.quotation.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除报价单失败:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { message: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: '删除报价单失败' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const data = await request.json()

    // 计算总金额
    let totalAmountRMB = 0
    let totalAmountUSD = 0
    data.items.forEach((item: any) => {
      const itemTotalRMB = item.priceRMB * item.quantity
      const itemTotalUSD = item.priceUSD * item.quantity
      totalAmountRMB += itemTotalRMB
      totalAmountUSD += itemTotalUSD
    })

    // 更新报价单
    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        exchangeRate: data.exchangeRate,
        totalAmountRMB: totalAmountRMB,
        totalAmountUSD: totalAmountUSD,
        items: {
          deleteMany: {},  // 删除所有现有项目
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
                images: true  // 确保包含商品的图片数据
              }
            }
          }
        }
      }
    })

    // 打印一下返回的数据，看看 images 是否存在
    console.log('API - 更新后的报价单数据:', JSON.stringify({
      id: quotation.id,
      items: quotation.items.map(item => ({
        productId: item.productId,
        images: item.product.images
      }))
    }, null, 2))

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('更新报价单失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新报价单失败' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.findUnique({
      where: {
        id: params.id
      },
      include: {
        customer: true,
        user: true,
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            }
          }
        }
      }
    })

    console.log('API - 获取到的报价单数据:', JSON.stringify({
      id: quotation?.id,
      items: quotation?.items.map(item => ({
        productId: item.productId,
        images: item.product.images
      }))
    }, null, 2))

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('获取报价单失败:', error)
    return NextResponse.json(
      { error: '获取报价单失败' },
      { status: 500 }
    )
  }
}