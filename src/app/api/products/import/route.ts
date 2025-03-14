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
const BATCH_SIZE = process.env.VERCEL === '1' ? 5 : 20 // Vercel环境使用更小的批次
const BATCH_DELAY = process.env.VERCEL === '1' ? 200 : 300 // Vercel环境使用更短的延迟
const MAX_EXECUTION_TIME = 45000 // 最大执行时间45秒

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
  // 记录开始时间，用于超时检测
  const startTime = Date.now()
  
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
    let processedCount = 0
    let totalCount = 0
    let failedBatches = [] // 记录失败的批次
    let batchErrors = [] // 记录批次错误
    let timeoutOccurred = false // 标记是否发生超时

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
      link1688: 'M'
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

    // 将需要更新的产品和新增的产品分开处理
    const productsToUpdate = updateDuplicates 
      ? products.filter(p => existingProducts.some(e => e.barcode === p.barcode))
      : []
    
    const productsToCreate = products.filter(p => 
      !existingProducts.some(e => e.barcode === p.barcode)
    )

    totalCount = productsToCreate.length + productsToUpdate.length
    console.log(`总共 ${products.length} 个产品，需要更新 ${productsToUpdate.length} 个，需要创建 ${productsToCreate.length} 个`)

    // 将产品分批处理
    const updateBatches = chunkArray(productsToUpdate, BATCH_SIZE)
    const createBatches = chunkArray(productsToCreate, BATCH_SIZE)

    // 进度跟踪函数
    const updateProgress = (action: string, current: number, total: number, batchIndex: number, batchCount: number) => {
      const percent = Math.round((current / total) * 100)
      const elapsedMs = Date.now() - startTime
      const elapsedSec = Math.round(elapsedMs / 1000)
      const estimatedTotalSec = total > 0 ? Math.round((elapsedMs / current) * total / 1000) : 0
      const remainingSec = Math.max(0, estimatedTotalSec - elapsedSec)
      
      console.log(
        `进度: ${action} ${current}/${total} (${percent}%), ` +
        `批次: ${batchIndex}/${batchCount}, ` +
        `已用时间: ${elapsedSec}秒, ` +
        `预计剩余: ${remainingSec}秒`
      )
    }

    try {
      // 处理更新批次
      if (updateBatches.length > 0) {
        console.log(`开始处理 ${updateBatches.length} 个更新批次`)
        
        for (let i = 0; i < updateBatches.length; i++) {
          // 检查是否接近超时
          if (isNearTimeout(startTime, MAX_EXECUTION_TIME)) {
            console.log('接近执行时间限制，中断处理')
            timeoutOccurred = true
            break
          }
          
          const batch = updateBatches[i]
          console.log(`处理更新批次 ${i + 1}/${updateBatches.length}，包含 ${batch.length} 个产品`)
          
          try {
            // 每个批次使用单独的事务
            await prisma.$transaction(async (tx) => {
              for (const product of batch) {
                const existing = existingProducts.find(e => e.barcode === product.barcode)
                if (!existing) continue

                await tx.product.update({
                  where: { id: existing.id },
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
                updatedCount++
                processedCount++
              }
            })
            
            // 更新进度
            updateProgress('更新', processedCount, totalCount, i + 1, updateBatches.length + createBatches.length)
            
            // 批次间添加延迟，避免连接池压力
            if (i < updateBatches.length - 1) {
              await delay(BATCH_DELAY)
            }
          } catch (error) {
            console.error(`更新批次 ${i + 1} 处理失败:`, error)
            // 记录失败的批次
            failedBatches.push({
              type: 'update',
              batchIndex: i,
              products: batch.map(p => p.barcode)
            })
            
            // 记录错误信息
            batchErrors.push({
              batchType: 'update',
              batchIndex: i,
              error: error instanceof Error ? error.message : '未知错误',
              timestamp: new Date().toISOString()
            })
            
            // 继续处理下一批次，而不是中断整个过程
            continue
          }
        }
      }

      // 处理创建批次
      if (createBatches.length > 0 && !timeoutOccurred) {
        console.log(`开始处理 ${createBatches.length} 个创建批次`)
        
        for (let i = 0; i < createBatches.length; i++) {
          // 检查是否接近超时
          if (isNearTimeout(startTime, MAX_EXECUTION_TIME)) {
            console.log('接近执行时间限制，中断处理')
            timeoutOccurred = true
            break
          }
          
          const batch = createBatches[i]
          console.log(`处理创建批次 ${i + 1}/${createBatches.length}，包含 ${batch.length} 个产品`)
          
          try {
            // 每个批次使用单独的事务
            await prisma.$transaction(async (tx) => {
              for (const product of batch) {
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
                createdCount++
                processedCount++
              }
            })
            
            // 更新进度
            updateProgress('创建', processedCount, totalCount, updateBatches.length + i + 1, updateBatches.length + createBatches.length)
            
            // 批次间添加延迟，避免连接池压力
            if (i < createBatches.length - 1) {
              await delay(BATCH_DELAY)
            }
          } catch (error) {
            console.error(`创建批次 ${i + 1} 处理失败:`, error)
            // 记录失败的批次
            failedBatches.push({
              type: 'create',
              batchIndex: i,
              products: batch.map(p => p.barcode)
            })
            
            // 记录错误信息
            batchErrors.push({
              batchType: 'create',
              batchIndex: i,
              error: error instanceof Error ? error.message : '未知错误',
              timestamp: new Date().toISOString()
            })
            
            // 继续处理下一批次，而不是中断整个过程
            continue
          }
        }
      }

      // 计算总耗时
      const totalTimeMs = Date.now() - startTime
      const totalTimeSec = Math.round(totalTimeMs / 1000)
      
      // 确定整体状态
      const hasFailures = failedBatches.length > 0 || timeoutOccurred
      let status = 'success'
      if (timeoutOccurred) {
        status = 'timeout'
      } else if (hasFailures) {
        status = 'partial_success'
      }
      
      // 构建响应消息
      let message = `导入成功：创建 ${createdCount} 个产品，更新 ${updatedCount} 个产品`
      if (timeoutOccurred) {
        message = `导入部分完成：由于执行时间限制，只处理了 ${processedCount}/${totalCount} 个产品。已创建 ${createdCount} 个，已更新 ${updatedCount} 个。`
        message += `建议将数据拆分为多个较小的文件（每个不超过50个产品）进行导入。`
      } else if (hasFailures) {
        message = `部分导入成功：成功创建 ${createdCount} 个产品，更新 ${updatedCount} 个产品，${failedBatches.length} 个批次失败`
      }
      
      return NextResponse.json({
        status,
        created: createdCount,
        updated: updatedCount,
        processed: processedCount,
        total: totalCount,
        errors: errors.length > 0 ? errors : undefined,
        totalTime: `${totalTimeSec}秒`,
        averageTimePerItem: processedCount > 0 ? `${Math.round(totalTimeMs / processedCount)}毫秒` : '0毫秒',
        failedBatchCount: failedBatches.length,
        failedBatches: hasFailures ? failedBatches : undefined,
        batchErrors: hasFailures ? batchErrors : undefined,
        timeoutOccurred,
        message
      }, { status: timeoutOccurred ? 202 : (hasFailures ? 207 : 200) }) // 202表示接受但处理未完成，207表示部分成功

    } catch (error) {
      console.error('数据库操作失败:', error)
      return NextResponse.json(
        { 
          error: '导入失败，数据库操作错误',
          details: error instanceof Error ? error.message : '未知错误',
          batchErrors: batchErrors.length > 0 ? batchErrors : undefined
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