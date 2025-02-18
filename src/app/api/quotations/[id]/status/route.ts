import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    // 验证状态值
    if (status !== 'ci' && status !== 'pi' && status !== 'draft') {
      return NextResponse.json(
        { error: '无效的状态值' },
        { status: 400 }
      )
    }

    // 获取当前报价单
    const currentQuotation = await prisma.quotation.findUnique({
      where: { id: params.id }
    })

    if (!currentQuotation) {
      return NextResponse.json(
        { error: '报价单不存在' },
        { status: 404 }
      )
    }

    // 验证状态转换规则
    if (currentQuotation.status === 'ci') {
      return NextResponse.json(
        { error: 'CI报价单不能修改状态' },
        { status: 400 }
      )
    }

    if (currentQuotation.status === 'pi' && status !== 'ci') {
      return NextResponse.json(
        { error: 'PI报价单只能转为CI' },
        { status: 400 }
      )
    }

    // 更新报价单状态
    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        status,
        // 创建修订历史
        revisions: {
          create: {
            version: 1,
            changes: {
              status: {
                from: currentQuotation.status,
                to: status
              }
            }
          }
        }
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('更新报价单状态失败:', error)
    return NextResponse.json(
      { error: '更新报价单状态失败' },
      { status: 500 }
    )
  }
}