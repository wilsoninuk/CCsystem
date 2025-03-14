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

// 批量处理配置
const BATCH_SIZE = 5; // 减小批处理大小，从之前的可能较大的值减小到5
const BATCH_DELAY = process.env.VERCEL === '1' ? 200 : 300 // Vercel环境使用更短的延迟
const MAX_EXECUTION_TIME = 8000; // 最大执行时间8秒，留2秒缓冲

// 辅助函数：将数组分割成指定大小的批次
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// 辅助函数：延迟指定时间
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 辅助函数：检查是否接近超时
function isNearTimeout(startTime: number, maxTime: number): boolean {
  return (Date.now() - startTime) > (maxTime * 0.8) // 如果已经使用了80%的最大时间
}

export async function POST(request: Request) {
  // 记录开始时间
  const startTime = Date.now();
  
  // 创建一个响应控制器，用于在接近超时时提前返回响应
  const controller = new AbortController();
  const { signal } = controller;
  
  // 设置一个定时器，在接近Vercel的超时限制时中止操作
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, MAX_EXECUTION_TIME);
  
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

    // 解析multipart/form-data请求
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "未提供文件" }, { status: 400 });
    }

    // 检查文件大小
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小超过限制，最大允许10MB，当前文件大小${(file.size / (1024 * 1024)).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // 检查文件类型
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      return NextResponse.json(
        { error: "仅支持Excel文件(.xlsx, .xls)" },
        { status: 400 }
      );
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer();
    const workbook = new ExcelJS.Workbook()
    
    try {
      await workbook.xlsx.load(buffer)
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
    let totalRows = 0
    let processedRows = 0
    let successRows = 0

    // 计算总行数（排除表头）
    totalRows = worksheet.rowCount - 1

    // 初始化进度
    let progress = {
      status: 'processing',
      action: '解析Excel数据',
      current: 0,
      total: totalRows,
      successCount: 0,
      errorCount: 0,
      batchIndex: 0,
      batchCount: 0,
      errors: [] as ImportError[]
    }

    // 更新进度的函数
    const updateProgress = (action: string, current: number, total: number, batchIndex: number, batchCount: number) => {
      progress = {
        ...progress,
        action,
        current,
        total,
        successCount: successRows,
        errorCount: errors.length,
        batchIndex,
        batchCount,
        errors: errors.slice(0, 10) // 只返回前10个错误
      }
    }

    // 解析每一行数据
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // 跳过标题行

      try {
        // 获取并清理单元格值
        const getCellValue = (column: string): string | null => {
          const cell = row.getCell(column)
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

        const product: ImportProduct = {
          itemNo: getCellValue('itemNo') || '',
          barcode: getCellValue('barcode') || '',
          description: getCellValue('description') || '',
          cost: getNumberValue('cost') || 0,
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

        products.push(product)
        successRows++
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

    if (existingProducts.length > 0) {
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

    // 分批导入数据
    const batches = chunkArray(products, BATCH_SIZE)
    let importedCount = 0
    let batchErrors: ImportError[] = []

    // 更新进度
    updateProgress('准备导入数据', 0, products.length, 0, batches.length)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      // 检查是否接近超时
      if (isNearTimeout(startTime, MAX_EXECUTION_TIME)) {
        console.log(`接近超时限制，已导入 ${importedCount}/${products.length} 条记录`)
        // 返回部分处理结果
        return NextResponse.json({
          status: 'partial',
          message: `导入部分完成，已导入 ${importedCount}/${products.length} 条记录，请减小文件大小或分批导入`,
          imported: importedCount,
          total: products.length,
          errors: [...errors, ...batchErrors].slice(0, 10)
        })
      }

      const batch = batches[batchIndex]
      updateProgress('导入数据', importedCount, products.length, batchIndex + 1, batches.length)

      try {
        // 使用事务批量导入
        await prisma.$transaction(async (tx) => {
          for (const product of batch) {
            // 检查条形码是否已存在
            const existingProduct = await tx.product.findUnique({
              where: { barcode: product.barcode },
              select: { id: true }
            })

            if (existingProduct) {
              // 更新现有商品
              await tx.product.update({
                where: { id: existingProduct.id },
                data: {
                  itemNo: product.itemNo,
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
                  updatedBy: user.id
                }
              })
            } else {
              // 创建新商品
              await tx.product.create({
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
            }
          }
        }, {
          timeout: 5000 // 设置事务超时为5秒
        })

        // 更新导入计数
        importedCount += batch.length
      } catch (error) {
        console.error(`批次 ${batchIndex + 1} 导入失败:`, error)
        
        // 记录批次错误
        batchErrors.push({
          row: -1, // 表示批次错误
          error: `批次 ${batchIndex + 1} 导入失败: ${error instanceof Error ? error.message : '未知错误'}`,
          details: { batchIndex, batchSize: batch.length }
        })
        
        // 继续处理下一批次，不中断整个导入过程
        // 添加短暂延迟，避免连续失败
        await delay(500)
      }
      
      // 每批次之间添加短暂延迟，避免数据库连接问题
      if (batchIndex < batches.length - 1) {
        await delay(300)
      }
    }

    // 清除超时定时器
    clearTimeout(timeoutId)

    // 返回导入结果
    return NextResponse.json({
      status: 'success',
      message: `成功导入 ${importedCount} 条记录`,
      imported: importedCount,
      total: products.length,
      errors: [...errors, ...batchErrors].length > 0 ? [...errors, ...batchErrors].slice(0, 10) : undefined
    })
  } catch (error) {
    console.error('导入失败:', error)
    
    // 清除超时定时器
    clearTimeout(timeoutId)
    
    // 如果是超时中止，返回部分完成信息
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({
        status: 'timeout',
        message: '导入操作超时，请减小文件大小或分批导入',
        timeElapsed: Date.now() - startTime
      })
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
} 