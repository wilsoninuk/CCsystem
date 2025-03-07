import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const customer = await prisma.customer.create({
      data: {
        ...data,
        isActive: true
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('创建客户失败:', error)
    return NextResponse.json(
      { error: '创建客户失败' },
      { status: 500 }
    )
  }
} 