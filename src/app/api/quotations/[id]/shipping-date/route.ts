import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { shippingDate } = await request.json()
    const id = params.id

    // 验证报价单是否存在
    const quotation = await prisma.quotation.findUnique({
      where: { id }
    })

    if (!quotation) {
      return NextResponse.json(
        { error: '报价单不存在' },
        { status: 404 }
      )
    }

    // 验证报价单状态是否为 CI
    if (quotation.status !== 'ci') {
      return NextResponse.json(
        { error: '只有 CI 状态的报价单才能设置出货时间' },
        { status: 400 }
      )
    }

    // 更新出货时间
    await prisma.quotation.update({
      where: { id },
      data: { shippingDate: new Date(shippingDate) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新出货时间失败:', error)
    return NextResponse.json(
      { error: '更新出货时间失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 