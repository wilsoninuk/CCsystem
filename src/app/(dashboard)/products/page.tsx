import { prisma } from "@/lib/db"
import { ProductsClient } from "./products-client"

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: {
      itemNo: 'asc'
    }
  })

  console.log('Products data:', products)  // 添加日志检查数据

  return <ProductsClient products={products} />
} 