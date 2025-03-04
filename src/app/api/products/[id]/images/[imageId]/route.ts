import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

// 删除图片
export async function DELETE(
  request: Request,
  context: { params: { id: string, imageId: string } }
) {
  try {
    // 获取并等待路由参数
    const { id, imageId } = context.params

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

    // 先检查图片是否存在
    const image = await prisma.productImage.findUnique({
      where: {
        id: imageId
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: "图片不存在" },
        { status: 404 }
      )
    }

    // 检查图片是否属于该产品
    if (image.productId !== id) {
      return NextResponse.json(
        { error: "图片不属于该产品" },
        { status: 403 }
      )
    }

    // 删除图片
    await prisma.productImage.delete({
      where: {
        id: imageId
      }
    })

    // 更新商品的更新者和更新时间
    await prisma.product.update({
      where: { id },
      data: {
        updatedBy: user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除图片失败' },
      { status: 500 }
    )
  }
}

// 设置为主图
export async function PUT(
  request: Request,
  context: { params: { id: string, imageId: string } }
) {
  try {
    // 获取并等待路由参数
    const { id, imageId } = context.params

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

    // 先检查图片是否存在
    const image = await prisma.productImage.findUnique({
      where: {
        id: imageId
      }
    })

    if (!image) {
      return NextResponse.json(
        { error: "图片不存在" },
        { status: 404 }
      )
    }

    // 检查图片是否属于该产品
    if (image.productId !== id) {
      return NextResponse.json(
        { error: "图片不属于该产品" },
        { status: 403 }
      )
    }

    // 将所有图片设置为非主图
    await prisma.productImage.updateMany({
      where: { productId: id },
      data: { isMain: false }
    })

    // 将选中的图片设置为主图
    await prisma.productImage.update({
      where: {
        id: imageId
      },
      data: {
        isMain: true
      }
    })

    // 更新商品的更新者和更新时间
    await prisma.product.update({
      where: { id },
      data: {
        updatedBy: user.id,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('设置主图失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '设置主图失败' },
      { status: 500 }
    )
  }
} 