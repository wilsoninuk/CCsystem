import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    const result = await prisma.product.deleteMany({
      where: {
        id: {
          in: ids
        }
      }
    })

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    return NextResponse.json(
      { error: '批量删除失败' },
      { status: 500 }
    )
  }
} 