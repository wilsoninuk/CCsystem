import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // 获取所有不重复的品类
    const categories = await prisma.product.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    })

    // 过滤出非空的品类并排序
    const validCategories = categories
      .map(c => c.category)
      .filter((category): category is string => !!category)
      .sort()

    return NextResponse.json(validCategories)
  } catch (error) {
    console.error('获取品类列表失败:', error)
    return NextResponse.json(
      { error: '获取品类列表失败' },
      { status: 500 }
    )
  }
} 