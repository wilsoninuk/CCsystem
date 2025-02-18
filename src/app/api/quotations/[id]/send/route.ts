import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const quotation = await prisma.quotation.update({
      where: { id: params.id },
      data: {
        status: 'sent',
        // 创建修订历史
        revisions: {
          create: {
            version: 1,
            changes: {
              status: {
                from: 'draft',
                to: 'sent'
              }
            }
          }
        }
      }
    })

    return NextResponse.json(quotation)
  } catch (error) {
    console.error('发送报价单失败:', error)
    return NextResponse.json(
      { error: '发送报价单失败' },
      { status: 500 }
    )
  }
} 