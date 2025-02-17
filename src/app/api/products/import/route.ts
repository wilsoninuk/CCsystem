import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product, Prisma } from '@prisma/client'

// 将函数声明移到块外部
const generateBarcode = (itemNo: string): string => {
  // 使用时间戳和随机数生成唯一条形码
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${itemNo}${timestamp}${random}`
}

export async function POST(request: Request) {
  try {
    const { products, updateDuplicates } = await request.json()
    
    if (!updateDuplicates) {
      // 只导入新商品
      const created = await prisma.product.createMany({
        data: products
      })
      return NextResponse.json({
        success: true,
        created: created.count,
        updated: 0
      })
    } else {
      // 更新重复商品并导入新商品
      console.log('收到导入请求，原始数据:', products)
      
      if (!Array.isArray(products)) {
        console.error('数据格式错误: 不是数组')
        return NextResponse.json(
          { success: false, error: '无效的数据格式' },
          { status: 400 }
        )
      }

      // 验证数据
      const validationErrors = products.map((product, index) => {
        if (!product.itemNo || !product.description || product.cost === undefined) {
          return {
            row: index + 1,
            error: '商品编号、商品描述、成本为必填项'
          }
        }
        return null
      }).filter(Boolean)

      if (validationErrors.length > 0) {
        return NextResponse.json({
          success: false,
          error: '数据验证失败',
          details: validationErrors
        }, { status: 400 })
      }

      // 检查已存在的商品编号
      const itemNos = products.map(p => p.itemNo)
      const existingProducts = await prisma.product.findMany({
        where: {
          itemNo: {
            in: itemNos
          }
        },
        select: { itemNo: true, barcode: true }
      })

      const existingItemNos = new Set(existingProducts.map(p => p.itemNo))
      const newProducts: Prisma.ProductCreateInput[] = []
      const updateProducts: Prisma.ProductUpdateInput[] = []

      // 分离新增和更新的商品
      products.forEach(product => {
        const formattedProduct = {
          itemNo: product.itemNo,
          description: product.description,
          cost: Number(product.cost),
          picture: product.picture || null,
          barcode: product.barcode || generateBarcode(product.itemNo),
          color: product.color || null,
          material: product.material || null,
          productSize: product.productSize || null,
          cartonSize: product.cartonSize || null,
          cartonWeight: product.cartonWeight ? Number(product.cartonWeight) : null,
          moq: product.moq ? Number(product.moq) : null,
          supplier: product.supplier || null,
          link1688: product.link1688 || null,
        }

        if (existingItemNos.has(product.itemNo)) {
          // 更新时不更新条形码
          const { barcode, ...updateData } = formattedProduct
          updateProducts.push(updateData)
        } else {
          newProducts.push(formattedProduct)
        }
      })

      console.log(`新增商品: ${newProducts.length} 条`)
      console.log(`更新商品: ${updateProducts.length} 条`)

      try {
        // 使用事务处理数据库操作
        const result = await prisma.$transaction(async (tx) => {
          // 更新已存在的商品
          const updateResults = await Promise.all(
            updateProducts.map(product => 
              tx.product.update({
                where: { itemNo: product.itemNo as string },
                data: {
                  ...product,
                  updatedAt: new Date()
                }
              })
            )
          )

          // 创建新商品
          const createResult = newProducts.length > 0 
            ? await tx.product.createMany({
                data: newProducts.map(p => ({
                  ...p,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }))
              })
            : { count: 0 }

          return {
            updated: updateResults.length,
            created: createResult.count
          }
        })

        return NextResponse.json({ 
          success: true,
          ...result
        })
      } catch (error) {
        console.error('数据库操作失败:', error)
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2002') {
            return NextResponse.json({
              success: false,
              error: '存在重复的商品编号或条形码'
            }, { status: 409 })
          }
        }
        throw error
      }
    }
  } catch (error) {
    console.error('导入错误:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '导入失败'
      },
      { status: 500 }
    )
  }
} 