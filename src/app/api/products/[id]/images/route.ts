import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 401 }
      )
    }

    const { url, isMain } = await request.json()

    // 如果是主图，先将其他图片设置为非主图
    if (isMain) {
      await prisma.productImage.updateMany({
        where: { productId: params.id },
        data: { isMain: false }
      })
    }

    // 创建新图片
    const image = await prisma.productImage.create({
      data: {
        url,
        isMain,
        productId: params.id
      }
    })

    // 更新商品的更新者和更新时间
    await prisma.product.update({
      where: { id: params.id },
      data: {
        updatedBy: user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(image)
  } catch (error) {
    console.error('创建图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建图片失败' },
      { status: 500 }
    )
  }
} 