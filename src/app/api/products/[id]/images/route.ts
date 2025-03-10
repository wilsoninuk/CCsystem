import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 })
    }

    // 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })
    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 })
    }

    // 获取请求数据
    const data = await req.json()
    const { url, urls, isMain } = data
    const productId = params.id

    // 更新商品的最后修改信息
    await prisma.product.update({
      where: { id: productId },
      data: {
        updatedAt: new Date(),
        updater: {
          connect: { id: user.id }
        }
      }
    })

    if (isMain) {
      // 处理主图
      if (url === null) {
        // 删除主图
        await prisma.productImage.deleteMany({
          where: {
            productId,
            isMain: true
          }
        })
      } else {
        // 先将所有图片设置为非主图
        await prisma.productImage.updateMany({
          where: {
            productId,
            isMain: true
          },
          data: {
            isMain: false
          }
        })

        // 创建或更新主图
        await prisma.productImage.create({
          data: {
            url,
            isMain: true,
            order: 0,
            product: {
              connect: { id: productId }
            }
          }
        })
      }
    } else {
      // 处理附加图片
      // 先删除所有非主图
      await prisma.productImage.deleteMany({
        where: {
          productId,
          isMain: false
        }
      })

      // 创建新的附加图片
      if (urls && urls.length > 0) {
        await prisma.productImage.createMany({
          data: urls.map((url: string, index: number) => ({
            url,
            isMain: false,
            order: index + 1,
            productId
          }))
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("更新商品图片失败:", error)
    return NextResponse.json(
      { error: "更新商品图片失败" },
      { status: 500 }
    )
  }
} 