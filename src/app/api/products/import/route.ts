import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product } from '@prisma/client'
import ExcelJS from 'exceljs'

interface ImportProduct {
  picture: string | null
  itemNo: string
  barcode: string
  description: string
  cost: number
  supplier: string | null
  color: string | null
  material: string | null
  productSize: string | null
  cartonSize: string | null
  cartonWeight: number | null
  moq: number | null
  link1688: string | null
}

// 将函数声明移到块外部
const generateBarcode = (itemNo: string): string => {
  // 使用时间戳和随机数生成唯一条形码
  const timestamp = Date.now().toString().slice(-6)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${itemNo}${timestamp}${random}`
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const updateDuplicates = formData.get('updateDuplicates') === 'true'

    const arrayBuffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const worksheet = workbook.getWorksheet(1)
    const products: ImportProduct[] = []
    const errors: ImportError[] = []

    // 定义列映射
    const columnMap = {
      picture: 'A',
      itemNo: 'B',
      barcode: 'C',
      description: 'D',
      cost: 'E',
      supplier: 'F',
      color: 'G',
      material: 'H',
      productSize: 'I',
      cartonSize: 'J',
      cartonWeight: 'K',
      moq: 'L',
      link1688: 'M'
    }

    // 从第二行开始读取数据（跳过标题行）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过标题行

      try {
        const product: ImportProduct = {
          picture: row.getCell(columnMap.picture).value?.toString() || null,
          itemNo: row.getCell(columnMap.itemNo).value?.toString() || '',
          barcode: row.getCell(columnMap.barcode).value?.toString() || '',
          description: row.getCell(columnMap.description).value?.toString() || '',
          cost: Number(row.getCell(columnMap.cost).value) || 0,
          supplier: row.getCell(columnMap.supplier).value?.toString() || null,
          color: row.getCell(columnMap.color).value?.toString() || null,
          material: row.getCell(columnMap.material).value?.toString() || null,
          productSize: row.getCell(columnMap.productSize).value?.toString() || null,
          cartonSize: row.getCell(columnMap.cartonSize).value?.toString() || null,
          cartonWeight: Number(row.getCell(columnMap.cartonWeight).value) || null,
          moq: Number(row.getCell(columnMap.moq).value) || null,
          link1688: row.getCell(columnMap.link1688).value?.toString() || null
        }

        // 验证必填字段
        if (!product.itemNo || !product.description || !product.cost) {
          throw new Error('商品编号、商品描述、成本为必填项')
        }

        products.push(product)
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : '数据格式错误'
        })
      }
    })

    // 检查条形码重复
    const existingProducts = await prisma.product.findMany({
      where: {
        OR: products.map(p => ({
          barcode: p.barcode
        }))
      }
    })

    if (existingProducts.length > 0 && !updateDuplicates) {
      // 返回重复的商品信息
      const duplicates = existingProducts.map(p => ({
        barcode: p.barcode,
        existingProduct: {
          itemNo: p.itemNo,
          description: p.description,
          supplier: p.supplier
        },
        newProduct: products.find(np => np.barcode === p.barcode)
      }))

      return NextResponse.json(
        { 
          error: '存在重复条形码', 
          duplicates,
          duplicateCount: duplicates.length
        },
        { status: 409 }
      )
    }

    // 处理导入
    if (updateDuplicates) {
      let updatedCount = 0
      let createdCount = 0

      // 使用事务处理更新和新增
      await prisma.$transaction(async (tx) => {
        // 更新已存在的商品
        for (const existing of existingProducts) {
          const newData = products.find(p => p.barcode === existing.barcode)
          if (!newData) continue

          await tx.product.update({
            where: { id: existing.id },
            data: {
              picture: newData.picture,
              itemNo: newData.itemNo,
              barcode: newData.barcode,
              description: newData.description,
              cost: newData.cost,
              supplier: newData.supplier,
              color: newData.color,
              material: newData.material,
              productSize: newData.productSize,
              cartonSize: newData.cartonSize,
              cartonWeight: newData.cartonWeight,
              moq: newData.moq,
              link1688: newData.link1688
            }
          })
          updatedCount++
        }

        // 添加新商品
        const newProducts = products.filter(p => 
          !existingProducts.some(e => e.barcode === p.barcode)
        )

        if (newProducts.length > 0) {
          const result = await tx.product.createMany({
            data: newProducts
          })
          createdCount = result.count
        }
      })

      return NextResponse.json({ 
        success: true,
        updated: updatedCount,
        created: createdCount
      })
    } else {
      // 只添加新商品
      const result = await prisma.product.createMany({
        data: products
      })

      return NextResponse.json({
        success: true,
        created: result.count
      })
    }
  } catch (error) {
    console.error('导入失败，详细错误:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
} 