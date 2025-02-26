import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product } from '@prisma/client'
import ExcelJS from 'exceljs'
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

interface ImportProduct {
  picture: string | null
  itemNo: string
  barcode: string
  category: string | null
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

// 添加导入错误类型定义
interface ImportError {
  row: number
  error: string
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
    // 1. 获取当前用户会话
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "未授权访问" },
        { status: 401 }
      )
    }

    // 2. 获取用户ID
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "用户不存在" },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const updateDuplicates = formData.get('updateDuplicates') === 'true'

    // 声明计数变量
    let createdCount = 0
    let updatedCount = 0

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())
    const worksheet = workbook.getWorksheet(1)

    if (!worksheet) {
      throw new Error('无法读取工作表')
    }

    const products: ImportProduct[] = []
    const errors: ImportError[] = []

    // 定义列映射（确保与导出模板一致）
    const columnMap = {
      picture: 'A',
      itemNo: 'B',
      barcode: 'C',
      category: 'D',  // 添加类别列
      description: 'E',
      cost: 'F',
      supplier: 'G',
      color: 'H',
      material: 'I',
      productSize: 'J',
      cartonSize: 'K',
      cartonWeight: 'L',
      moq: 'M',
      link1688: 'N'
    }

    // 从第二行开始读取数据（跳过标题行）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过标题行

      try {
        const product: ImportProduct = {
          picture: row.getCell(columnMap.picture).value?.toString() || null,
          itemNo: row.getCell(columnMap.itemNo).value?.toString() || '',
          barcode: row.getCell(columnMap.barcode).value?.toString() || '',
          category: row.getCell(columnMap.category).value?.toString() || null,
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
        if (!product.itemNo || !product.barcode || !product.description) {
          throw new Error(`第 ${rowNumber} 行数据不完整，商品编号、条形码和描述为必填项`)
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

    // 3. 在创建或更新商品时添加用户信息
    if (updateDuplicates) {
      await prisma.$transaction(async (tx) => {
        // 更新已存在的商品
        for (const existing of existingProducts) {
          const newData = products.find(p => p.barcode === existing.barcode)
          if (!newData) continue

          await tx.product.update({
            where: { id: existing.id },
            data: {
              ...newData,
              updatedBy: user.id  // 添加更新者ID
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
            data: newProducts.map(product => ({
              ...product,
              createdBy: user.id,  // 添加创建者ID
              updatedBy: user.id   // 添加更新者ID
            }))
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
        data: products.map(product => ({
          ...product,
          createdBy: user.id,
          updatedBy: user.id
        }))
      })
      createdCount = result.count

      return NextResponse.json({
        success: true,
        created: createdCount
      })
    }
  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
} 