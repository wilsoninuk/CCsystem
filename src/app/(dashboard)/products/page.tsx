import { prisma } from "@/lib/db"
import { ProductsClient } from "./products-client"

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  // 从数据库获取所有商品数据
  const products = await prisma.product.findMany({
    orderBy: {
      createdAt: 'desc'
    }
  })

  return <ProductsClient products={products} />
} 