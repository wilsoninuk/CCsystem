import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import { Product } from '@prisma/client'
import ExcelJS from 'exceljs'
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

interface ImportProduct {
  itemNo: string
  barcode: string
  description: string
  cost: number
  mainImage: string | null
  additionalImages: string[]
  category: string | null
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
  details?: any
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
    const file = formData.get('file')
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "请选择要导入的Excel文件" },
        { status: 400 }
      )
    }

    const updateDuplicates = formData.get('updateDuplicates') === 'true'

    // 声明计数变量
    let createdCount = 0
    let updatedCount = 0
    let errorCount = 0

    const workbook = new ExcelJS.Workbook()
    
    try {
      await workbook.xlsx.load(await file.arrayBuffer())
    } catch (error) {
      console.error('Excel文件读取失败:', error)
      return NextResponse.json(
        { error: "Excel文件格式错误或文件已损坏" },
        { status: 400 }
      )
    }

    const worksheet = workbook.getWorksheet(1)

    if (!worksheet) {
      return NextResponse.json(
        { error: "无法读取工作表，请确保文件格式正确" },
        { status: 400 }
      )
    }

    if (worksheet.rowCount <= 1) {
      return NextResponse.json(
        { error: "Excel文件中没有数据" },
        { status: 400 }
      )
    }

    const products: ImportProduct[] = []
    const errors: ImportError[] = []

    // 定义列映射（确保与导出模板一致）
    const columnMap: Record<string, string> = {
      itemNo: 'A',
      barcode: 'B',
      description: 'C',
      cost: 'D',
      category: 'E',
      supplier: 'F',
      color: 'G',
      material: 'H',
      productSize: 'I',
      cartonSize: 'J',
      cartonWeight: 'K',
      moq: 'L',
      link1688: 'M',
      mainImage: 'N',
      image1: 'O',
      image2: 'P',
      image3: 'Q',
      image4: 'R'
    }

    // 从第二行开始读取数据（跳过标题行）
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过标题行

      try {
        // 获取并清理单元格值
        const getCellValue = (column: string): string | null => {
          const cell = row.getCell(columnMap[column])
          const value = cell?.value
          if (value === null || value === undefined) {
            console.log(`行 ${rowNumber} 列 ${column} 的值为空`)
            return null
          }
          const strValue = value.toString().trim()
          console.log(`行 ${rowNumber} 列 ${column} 的值为: "${strValue}"`)
          return strValue
        }

        // 获取数字值
        const getNumberValue = (column: string): number | null => {
          const strValue = getCellValue(column)
          if (strValue === null) return null
          const num = Number(strValue)
          if (isNaN(num)) {
            console.log(`行 ${rowNumber} 列 ${column} 的值 "${strValue}" 不是有效的数字`)
            return null
          }
          return num
        }

        // 收集所有附加图片
        const additionalImages = [
          getCellValue('image1'),
          getCellValue('image2'),
          getCellValue('image3'),
          getCellValue('image4'),
        ].filter(url => url && url.trim() !== '') as string[]

        const product: ImportProduct = {
          itemNo: getCellValue('itemNo') || '',
          barcode: getCellValue('barcode') || '',
          description: getCellValue('description') || '',
          cost: getNumberValue('cost') || 0,
          mainImage: getCellValue('mainImage'),
          additionalImages,
          category: getCellValue('category'),
          supplier: getCellValue('supplier'),
          color: getCellValue('color'),
          material: getCellValue('material'),
          productSize: getCellValue('productSize'),
          cartonSize: getCellValue('cartonSize'),
          cartonWeight: getNumberValue('cartonWeight'),
          moq: getNumberValue('moq'),
          link1688: getCellValue('link1688')
        }

        // 验证必填字段
        const requiredFields = {
          itemNo: product.itemNo,
          barcode: product.barcode,
          description: product.description,
          cost: product.cost
        }

        console.log(`处理第 ${rowNumber} 行数据:`, {
          itemNo: product.itemNo,
          barcode: product.barcode,
          description: product.description,
          cost: product.cost
        })

        const missingFields = Object.entries(requiredFields)
          .filter(([key, value]) => {
            const isEmpty = !value || (typeof value === 'string' && value.trim() === '')
            if (isEmpty) {
              console.log(`第 ${rowNumber} 行缺少必填字段: ${key}`)
            }
            return isEmpty
          })
          .map(([key]) => key)

        if (missingFields.length > 0) {
          throw new Error(`第 ${rowNumber} 行缺少必填字段: ${missingFields.join(', ')}`)
        }

        // 验证条形码格式
        if (!/^\d{13}$/.test(product.barcode)) {
          console.log(`第 ${rowNumber} 行条形码格式错误: "${product.barcode}"`)
          throw new Error(`条形码格式错误，必须是13位数字，当前值: ${product.barcode}`)
        }

        // 验证成本
        if (product.cost <= 0) {
          throw new Error(`成本必须大于0，当前值: ${product.cost}`)
        }

        // 验证图片URL格式
        const validateImageUrl = (url: string | null) => {
          if (url && !url.match(/^https?:\/\/.+/)) {
            throw new Error(`图片URL格式错误: ${url}`)
          }
        }

        validateImageUrl(product.mainImage)
        product.additionalImages.forEach(validateImageUrl)

        // 验证图片数量
        if (product.additionalImages.length > 4) {
          throw new Error(`附加图片数量超过限制，最多允许4张，当前数量: ${product.additionalImages.length}`)
        }

        products.push(product)
      } catch (error) {
        errors.push({
          row: rowNumber,
          error: error instanceof Error ? error.message : '数据格式错误',
          details: error
        })
        errorCount++
      }
    })

    if (products.length === 0) {
      return NextResponse.json(
        { 
          error: "没有有效的商品数据可以导入",
          details: errors
        },
        { status: 400 }
      )
    }

    // 检查条形码重复（在导入数据中）
    const duplicateBarcodesInImport = products.filter(
      (product, index) => products.findIndex(p => p.barcode === product.barcode) !== index
    )

    if (duplicateBarcodesInImport.length > 0) {
      return NextResponse.json(
        {
          error: '导入数据中存在重复条形码',
          duplicates: duplicateBarcodesInImport.map(p => ({
            barcode: p.barcode,
            itemNo: p.itemNo,
            rowNumbers: products
              .map((prod, idx) => prod.barcode === p.barcode ? idx + 2 : null)
              .filter(row => row !== null)
          }))
        },
        { status: 400 }
      )
    }

    // 检查条形码重复（在数据库中）
    const existingProducts = await prisma.product.findMany({
      where: {
        OR: products.map(p => ({
          barcode: p.barcode
        }))
      },
      include: {
        images: true
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
          error: '数据库中存在重复条形码', 
          duplicates,
          duplicateCount: duplicates.length
        },
        { status: 409 }
      )
    }

    // 使用事务处理所有数据库操作
    try {
      await prisma.$transaction(async (tx) => {
        if (updateDuplicates) {
          // 更新已存在的商品
          for (const existing of existingProducts) {
            const newData = products.find(p => p.barcode === existing.barcode)
            if (!newData) continue

            try {
              // 删除现有图片
              await tx.productImage.deleteMany({
                where: { productId: existing.id }
              })

              // 更新商品基本信息
              await tx.product.update({
                where: { id: existing.id },
                data: {
                  itemNo: newData.itemNo,
                  description: newData.description,
                  cost: newData.cost,
                  category: newData.category,
                  supplier: newData.supplier,
                  color: newData.color,
                  material: newData.material,
                  productSize: newData.productSize,
                  cartonSize: newData.cartonSize,
                  cartonWeight: newData.cartonWeight,
                  moq: newData.moq,
                  link1688: newData.link1688,
                  updatedBy: user.id
                }
              })

              // 创建新的图片记录
              if (newData.mainImage) {
                await tx.productImage.create({
                  data: {
                    url: newData.mainImage,
                    isMain: true,
                    order: 0,
                    productId: existing.id
                  }
                })
              }

              // 创建附加图片记录
              for (let i = 0; i < newData.additionalImages.length; i++) {
                await tx.productImage.create({
                  data: {
                    url: newData.additionalImages[i],
                    isMain: false,
                    order: i + 1,
                    productId: existing.id
                  }
                })
              }

              updatedCount++
            } catch (error) {
              console.error(`更新商品失败 (barcode: ${existing.barcode}):`, error)
              throw error
            }
          }
        }

        // 添加新商品
        const newProducts = products.filter(p => 
          !existingProducts.some(e => e.barcode === p.barcode)
        )

        // 批量创建新商品
        for (const product of newProducts) {
          try {
            // 创建商品基本信息
            const newProduct = await tx.product.create({
              data: {
                itemNo: product.itemNo,
                barcode: product.barcode,
                description: product.description,
                cost: product.cost,
                category: product.category,
                supplier: product.supplier,
                color: product.color,
                material: product.material,
                productSize: product.productSize,
                cartonSize: product.cartonSize,
                cartonWeight: product.cartonWeight,
                moq: product.moq,
                link1688: product.link1688,
                createdBy: user.id,
                updatedBy: user.id
              }
            })

            // 创建主图记录
            if (product.mainImage) {
              await tx.productImage.create({
                data: {
                  url: product.mainImage,
                  isMain: true,
                  order: 0,
                  productId: newProduct.id
                }
              })
            }

            // 创建附加图片记录
            for (let i = 0; i < product.additionalImages.length; i++) {
              await tx.productImage.create({
                data: {
                  url: product.additionalImages[i],
                  isMain: false,
                  order: i + 1,
                  productId: newProduct.id
                }
              })
            }

            createdCount++
          } catch (error) {
            console.error(`创建商品失败 (barcode: ${product.barcode}):`, error)
            throw error
          }
        }
      })

      return NextResponse.json({
        success: true,
        created: createdCount,
        updated: updatedCount,
        errors: errors.length > 0 ? errors : undefined
      })

    } catch (error) {
      console.error('数据库操作失败:', error)
      return NextResponse.json(
        { 
          error: '导入失败，数据库操作错误',
          details: error instanceof Error ? error.message : '未知错误'
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('导入失败:', error)
    return NextResponse.json(
      { 
        error: '导入失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
} 