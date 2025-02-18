import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

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
            product: true
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