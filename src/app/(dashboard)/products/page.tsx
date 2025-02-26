import { prisma } from "@/lib/db"
import { ProductsClient } from "./products-client"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  // 1. 检查认证状态
  const session = await getServerSession(authOptions)
  console.log('Current session:', session)

  // 2. 检查数据库连接
  try {
    // 先检查总数
    const count = await prisma.product.count()
    console.log('Total products in database:', count)

    // 检查一条记录
    const sampleProduct = await prisma.product.findFirst()
    console.log('Sample product:', sampleProduct)

    // 正常查询
    const products = await prisma.product.findMany({
      include: {
        creator: {
          select: {
            name: true,
            email: true
          }
        },
        updater: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        itemNo: 'asc'
      }
    })

    console.log('Products from DB:', products)
    return <ProductsClient products={products} />
  } catch (error) {
    console.error('Database error:', error)
    throw error
  }
} 