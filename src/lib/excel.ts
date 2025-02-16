import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { Product } from '@prisma/client'

// 定义 Excel 列的映射关系
const EXCEL_HEADERS = {
  itemNo: '商品编号',
  description: '商品描述',
  cost: '成本',
  picture: '商品图片',
  barcode: '条形码',
  color: '颜色/款式',
  material: '材料',
  productSize: '产品尺寸',
  cartonSize: '装箱尺寸',
  cartonWeight: '装箱重量',
  moq: 'MOQ',
  supplier: '供应商',
  link1688: '1688链接',
}

// 导出 Excel
export async function exportToExcel(products: Product[]) {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('商品列表')

  // 设置列
  worksheet.columns = Object.entries(EXCEL_HEADERS).map(([key, header]) => ({
    header,
    key,
    width: key === 'picture' ? 40 : 15 // 图片链接列宽一些
  }))

  // 添加数据
  worksheet.addRows(products)

  // 设置样式
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  // 设置边框
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })

  // 冻结表头
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // 生成并下载
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  saveAs(blob, `商品列表_${new Date().toLocaleDateString()}.xlsx`)
}

// 导入 Excel
export async function importFromExcel(file: File): Promise<{
  success: Partial<Product>[];
  errors: { row: number; error: string }[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        
        const worksheet = workbook.getWorksheet(1)
        if (!worksheet) {
          throw new Error('工作表不存在')
        }

        const success: Partial<Product>[] = []
        const errors: { row: number; error: string }[] = []

        // 读取数据行
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return // 跳过表头

          try {
            const product: Partial<Product> = {}
            
            // 处理每一列
            for (const [key, header] of Object.entries(EXCEL_HEADERS)) {
              const colIndex = getColumnIndex(header, worksheet)
              if (colIndex === -1) continue

              let value: any = row.getCell(colIndex).value

              // 特殊处理数字列
              if (key === 'cost' || key === 'cartonWeight') {
                value = typeof value === 'number' ? value : null
              }
              // 特殊处理整数列
              else if (key === 'moq') {
                value = typeof value === 'number' ? Math.floor(value) : null
              }
              // 其他列
              else {
                value = value?.toString() || null
              }

              product[key as keyof Product] = value
            }

            // 验证必填字段
            if (!product.itemNo || !product.description) {
              throw new Error('商品编号和商品描述为必填项')
            }

            success.push(product)
          } catch (error) {
            errors.push({
              row: rowNumber,
              error: error instanceof Error ? error.message : '未知错误'
            })
          }
        })

        console.log('导入结果:', {
          success: success.length,
          errors: errors.length,
          data: success
        })

        resolve({ success, errors })
      } catch (error) {
        console.error('Excel 处理错误:', error)
        reject(error)
      }
    }

    reader.onerror = (error) => {
      console.error('文件读取错误:', error)
      reject(new Error('读取文件失败'))
    }

    reader.readAsArrayBuffer(file)
  })
}

// 辅助函数：获取列索引
function getColumnIndex(header: string, worksheet: ExcelJS.Worksheet): number {
  let colIndex = -1
  worksheet.getRow(1).eachCell((cell, col) => {
    if (cell.value === header) {
      colIndex = col
    }
  })
  return colIndex
}

// 生成导入模板
export async function generateTemplate() {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('商品列表')

  // 设置列
  worksheet.columns = Object.entries(EXCEL_HEADERS).map(([key, header]) => ({
    header,
    key,
    width: key === 'picture' ? 40 : 15 // 图片链接列宽一些
  }))

  // 设置样式
  worksheet.getRow(1).font = { bold: true }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  // 添加示例数据
  worksheet.addRow({
    itemNo: 'DEMO001',
    description: '示例商品',
    cost: 100,
    picture: 'https://example.com/image.jpg', // 示例图片链接
    barcode: '6901234567890',
    color: '红色',
    material: '塑料',
    productSize: '10x10x10cm',
    cartonSize: '50x50x50cm',
    cartonWeight: 5,
    moq: 1000,
    supplier: '示例供应商',
    link1688: 'https://detail.1688.com/demo'
  })

  // 添加说明
  worksheet.addRow([])
  worksheet.addRow(['注意事项：'])
  worksheet.addRow(['1. 商品编号、商品描述、成本为必填项'])
  worksheet.addRow(['2. 图片请填写图片的URL链接'])
  worksheet.addRow(['3. 支持 JPG、PNG 格式的图片链接'])
  worksheet.addRow(['4. 装箱重量单位为kg'])
  worksheet.addRow(['5. MOQ为整数'])

  // 生成并下载
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  saveAs(blob, `商品导入模板_${new Date().toLocaleDateString()}.xlsx`)
}