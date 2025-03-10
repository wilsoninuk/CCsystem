import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const supplier = searchParams.get('supplier')
    const showDeleted = searchParams.get('showDeleted') === 'true'
    
    const products = await prisma.product.findMany({
      where: {
        ...(showDeleted ? {
          updatedAt: new Date('2000-01-01')
        } : {
          updatedAt: {
            gt: new Date('2000-01-01')
          }
        }),
        ...(search && {
          OR: [
            { itemNo: { contains: search, mode: 'insensitive' } },
            { barcode: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }),
        ...(category && category !== 'all' && {
          category: category
        }),
        ...(supplier && supplier !== 'all' && {
          supplier: supplier
        })
      },
      include: {
        images: {
          orderBy: {
            order: 'asc'
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            image: true
          }
        },
        updater: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 添加日志以检查图片数据
    console.log('API - 返回的产品数据:', products.map(product => ({
      id: product.id,
      imagesCount: product.images.length,
      hasMainImage: product.images.some(img => img.isMain)
    })))

    return NextResponse.json(products)
  } catch (error) {
    console.error('获取商品列表失败:', error)
    return NextResponse.json(
      { error: '获取商品列表失败' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
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
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 401 }
      )
    }

    const data = await request.json()

    // 验证必填字段
    if (!data.itemNo || !data.barcode || !data.description || !data.cost) {
      return NextResponse.json(
        { error: "缺少必填字段" },
        { status: 400 }
      )
    }

    // 检查条形码是否已存在
    const existingProduct = await prisma.product.findUnique({
      where: { barcode: data.barcode }
    })

    if (existingProduct) {
      return NextResponse.json(
        { error: "条形码已存在" },
        { status: 409 }
      )
    }

    // 3. 创建商品，添加创建者和更新者ID
    const product = await prisma.$transaction(async (tx) => {
      // 创建商品基本信息
      const newProduct = await tx.product.create({
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
          moq: data.moq ? parseInt(data.moq) : null,
          isActive: true,
          createdBy: user.id,
          updatedBy: user.id
        }
      })

      // 如果有主图，创建主图记录
      if (data.picture) {
        await tx.productImage.create({
          data: {
            url: data.picture,
            isMain: true,
            order: 0,
            productId: newProduct.id
          }
        })
      }

      // 如果有附图，创建附图记录
      if (data.additionalPictures?.length > 0) {
        await Promise.all(
          data.additionalPictures.filter(url => url).map((url, index) =>
            tx.productImage.create({
              data: {
                url,
                isMain: false,
                order: index + 1,
                productId: newProduct.id
              }
            })
          )
        )
      }

      return newProduct
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('创建失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    )
  }
} 