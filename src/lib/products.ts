import { prisma } from './db'
import { Product } from '@prisma/client'

export async function getProductByBarcode(barcode: string) {
  return prisma.product.findUnique({
    where: { barcode },
    include: {
      customerPrices: true,
      quotationItems: true,
    },
  })
}

export async function searchProducts(query: string) {
  return prisma.product.findMany({
    where: {
      OR: [
        { barcode: { contains: query } },
        { itemNo: { contains: query } },
        { description: { contains: query } },
      ],
    },
  })
}

export async function createProduct(data: Omit<Product, 'createdAt' | 'updatedAt'>) {
  return prisma.product.create({
    data,
  })
}

export async function updateProduct(barcode: string, data: Partial<Product>) {
  return prisma.product.update({
    where: { barcode },
    data,
  })
} 