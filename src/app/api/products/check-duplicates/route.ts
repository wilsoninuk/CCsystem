import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product } from "@prisma/client"

export async function POST(request: Request) {
  try {
    const products = await request.json()
    
    const itemNos = products.map((p: Partial<Product>) => p.itemNo)
    const barcodes = products
      .filter((p: Partial<Product>) => p.barcode)
      .map((p: Partial<Product>) => p.barcode)

    // 查找已存在的商品
    const existingProducts = await prisma.product.findMany({
      where: {
        OR: [
          { itemNo: { in: itemNos } },
          { barcode: { in: barcodes } }
        ]
      }
    })

    // 构建重复项列表
    const duplicates = products.map((product: Partial<Product>) => {
      const existingByItemNo = existingProducts.find(
        p => p.itemNo === product.itemNo
      )
      if (existingByItemNo) {
        return {
          product,
          existingProduct: existingByItemNo,
          reason: 'itemNo' as const
        }
      }

      const existingByBarcode = existingProducts.find(
        p => p.barcode === product.barcode
      )
      if (existingByBarcode) {
        return {
          product,
          existingProduct: existingByBarcode,
          reason: 'barcode' as const
        }
      }

      return null
    }).filter(Boolean)

    return NextResponse.json(duplicates)
  } catch (error) {
    console.error('检查重复失败:', error)
    return NextResponse.json(
      { error: '检查重复失败' },
      { status: 500 }
    )
  }
} 