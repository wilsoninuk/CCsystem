import { getServerSession } from "next-auth"
import { authOptions } from "../auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const supplier = searchParams.get('supplier')

    // 构建查询条件
    const where = {
      AND: [
        // 如果有搜索关键词，匹配商品编号、条形码或描述
        search ? {
          OR: [
            { itemNo: { contains: search } },
            { barcode: { contains: search } },
            { description: { contains: search } }
          ]
        } : {},
        // 如果选择了品类且不是 "all"，匹配品类
        category && category !== 'all' ? { category } : {},
        // 如果选择了供应商且不是 "all"，匹配供应商
        supplier && supplier !== 'all' ? { supplier } : {},
        // 只返回激活状态的商品
        { isActive: true }
      ]
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: true
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

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
    const product = await prisma.product.create({
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

    return NextResponse.json(product)
  } catch (error) {
    console.error('创建失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建失败' },
      { status: 500 }
    )
  }
} 