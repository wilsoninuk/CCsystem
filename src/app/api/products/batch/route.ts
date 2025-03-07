import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json()

    // 添加日志
    console.log('Attempting to delete products with ids:', ids)

    // 使用事务确保数据一致性
    const result = await prisma.$transaction(async (tx) => {
      // 1. 删除相关的报价单项目
      await tx.quotationItem.deleteMany({
        where: {
          productId: {
            in: ids
          }
        }
      })

      // 2. 删除相关的客户商品价格记录
      await tx.customerProductPrice.deleteMany({
        where: {
          productId: {
            in: ids
          }
        }
      })

      // 3. 最后删除商品
      return await tx.product.deleteMany({
        where: {
          id: {
            in: ids
          }
        }
      })
    })

    console.log('Delete result:', result)

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    console.error('批量删除失败:', error)
    return NextResponse.json(
      { error: '批量删除失败: ' + (error as Error).message },
      { status: 500 }
    )
  }
} 