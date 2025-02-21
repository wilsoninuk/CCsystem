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
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      throw new Error('未找到文件')
    }

    console.log('开始处理文件:', file.name)
    const updateDuplicates = formData.get('updateDuplicates') === 'true'

    // 解析Excel文件
    const buffer = await file.arrayBuffer()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    
    const worksheet = workbook.getWorksheet(1)
    if (!worksheet) throw new Error('Excel文件格式错误')

    // 解析数据
    const products: ImportProduct[] = []
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过表头

      const product: ImportProduct = {
        picture: row.getCell('picture').value?.toString() || null,
        itemNo: row.getCell('itemNo').value?.toString() || '',
        barcode: row.getCell('barcode').value?.toString() || '',
        description: row.getCell('description').value?.toString() || '',
        cost: Number(row.getCell('cost').value) || 0,
        supplier: row.getCell('supplier').value?.toString() || null,
        color: row.getCell('color').value?.toString() || null,
        material: row.getCell('material').value?.toString() || null,
        productSize: row.getCell('productSize').value?.toString() || null,
        cartonSize: row.getCell('cartonSize').value?.toString() || null,
        cartonWeight: row.getCell('cartonWeight').value ? Number(row.getCell('cartonWeight').value) : null,
        moq: row.getCell('moq').value ? Number(row.getCell('moq').value) : null,
        link1688: row.getCell('link1688').value?.toString() || null,
      }

      // 验证必填字段
      if (!product.itemNo || !product.barcode || !product.description || !product.cost) {
        throw new Error(`第 ${rowNumber} 行数据不完整，请检查必填字段`)
      }

      products.push(product)
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
      // 更新已存在的商品
      const updatePromises = existingProducts.map(existing => {
        const newData = products.find(p => p.barcode === existing.barcode)
        if (!newData) return Promise.resolve() // 处理未找到的情况

        // 明确指定更新数据的类型
        return prisma.product.update({
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
      }).filter(Boolean) // 过滤掉 undefined 的 Promise

      // 添加新商品（条形码不重复的）
      const newProducts = products.filter(p => 
        !existingProducts.some(e => e.barcode === p.barcode)
      )

      const result = await prisma.$transaction([
        ...updatePromises,
        prisma.product.createMany({
          data: newProducts
        })
      ])

      return NextResponse.json({ 
        success: true,
        updated: existingProducts.length,
        created: newProducts.length
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