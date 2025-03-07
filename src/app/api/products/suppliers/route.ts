import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 获取所有不重复的供应商
    const suppliers = await prisma.product.findMany({
      where: { isActive: true },
      select: { supplier: true },
      distinct: ['supplier']
    })

    // 过滤出非空的供应商并排序
    const validSuppliers = suppliers
      .map(s => s.supplier)
      .filter((supplier): supplier is string => !!supplier)
      .sort()

    return NextResponse.json(validSuppliers)
  } catch (error) {
    console.error('获取供应商列表失败:', error)
    return NextResponse.json(
      { error: '获取供应商列表失败' },
      { status: 500 }
    )
  }
} 