import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product } from "@prisma/client"
import { Prisma } from '@prisma/client'

export async function POST(request: Request) {
  try {
    const products = await request.json()
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
      select: { itemNo: true }
    })

    const existingItemNos = new Set(existingProducts.map(p => p.itemNo))
    const newProducts = []
    const updateProducts = []

    // 分离新增和更新的商品
    products.forEach(product => {
      const formattedProduct = {
        itemNo: product.itemNo,
        description: product.description,
        cost: Number(product.cost),
        picture: product.picture || null,
        barcode: product.barcode || null,
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
        updateProducts.push(formattedProduct)
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
              where: { itemNo: product.itemNo },
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
      throw error
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