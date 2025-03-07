import { prisma } from "@/lib/db"
import { ProductForm } from "./product-form"
import { notFound } from "next/navigation"

export default async function EditProductPage({
  params
}: {
  params: { id: string }
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.id }
  })

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto py-10">
      <ProductForm product={product} />
    </div>
  )
} 