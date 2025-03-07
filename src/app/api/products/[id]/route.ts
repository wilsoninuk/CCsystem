import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. 获取当前用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 2. 通过 email 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 401 }
      )
    }

    const data = await request.json()
    const productId = params.id

    // 获取当前产品信息
    const currentProduct = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!currentProduct) {
      return NextResponse.json(
        { error: "产品不存在" },
        { status: 404 }
      )
    }

    // 只有当条形码发生变化时才检查唯一性
    if (data.barcode && data.barcode !== currentProduct.barcode) {
      const existingProduct = await prisma.product.findFirst({
        where: {
          barcode: data.barcode,
          NOT: {
            id: productId
          }
        }
      })

      if (existingProduct) {
        return NextResponse.json(
          { error: "条形码已被其他产品使用" },
          { status: 409 }
        )
      }
    }

    // 3. 更新商品
    const product = await prisma.product.update({
      where: { 
        id: productId
      },
      data: {
        itemNo: data.itemNo,
        barcode: data.barcode,
        description: data.description,
        cost: parseFloat(data.cost),
        category: data.category || null,
        supplier: data.supplier || null,
        color: data.color || null,
        material: data.material || null,
        productSize: data.productSize || null,
        cartonSize: data.cartonSize || null,
        cartonWeight: data.cartonWeight ? parseFloat(data.cartonWeight) : null,
        moq: data.moq ? parseInt(data.moq) : null,
        link1688: data.link1688 || null,
        updatedBy: user.id
      },
      include: {
        images: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true
          }
        }
      }
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('更新失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    )
  }
} 