import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import ExcelJS from 'exceljs'

export async function POST(request: Request) {
  try {
    const { ids } = await request.json()

    // 查询商品数据
    const products = await prisma.product.findMany({
      where: ids ? { id: { in: ids } } : undefined,
      orderBy: { itemNo: 'asc' }
    })

    // 创建工作簿
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('商品列表')

    // 设置列宽和表头
    worksheet.columns = [
      { header: '商品图片', key: 'picture', width: 15 },
      { header: '商品编号', key: 'itemNo', width: 15 },
      { header: '条形码', key: 'barcode', width: 15 },
      { header: '类别', key: 'category', width: 15 },
      { header: '商品描述', key: 'description', width: 30 },
      { header: '成本', key: 'cost', width: 10 },
      { header: '供应商', key: 'supplier', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
      { header: '颜色/款式', key: 'color', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
      { header: '材料', key: 'material', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
      { header: '产品尺寸', key: 'productSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
      { header: '装箱尺寸', key: 'cartonSize', width: 15, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
      { header: '装箱重量', key: 'cartonWeight', width: 10, style: { alignment: { vertical: 'middle', horizontal: 'right' } } },
      { header: 'MOQ', key: 'moq', width: 10, style: { alignment: { vertical: 'middle', horizontal: 'right' } } },
      { header: '1688链接', key: 'link1688', width: 30, style: { alignment: { vertical: 'middle', horizontal: 'left' } } },
    ]

    // 设置行高
    worksheet.getRow(1).height = 30
    
    // 先处理所有图片
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNumber = i + 2  // 表头占据第一行

      // 如果有图片，先添加图片
      if (product.picture) {
        try {
          const imageResponse = await fetch(product.picture)
          if (!imageResponse.ok) {
            console.error('获取图片失败:', product.picture)
            continue
          }

          const imageArrayBuffer = await imageResponse.arrayBuffer()
          const imageId = workbook.addImage({
            buffer: imageArrayBuffer,
            extension: 'jpeg',
          })

          // 添加图片到单元格
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowNumber - 1 },
            br: { col: 1, row: rowNumber },
            editAs: 'oneCell'
          } as any)

          // 设置行高
          worksheet.getRow(rowNumber).height = 80
        } catch (error) {
          console.error('添加图片失败:', error, product.picture)
        }
      }
    }

    // 再添加所有文字数据
    products.forEach((product, index) => {
      const rowNumber = index + 2
      const row = worksheet.getRow(rowNumber)

      // 设置每个单元格的值和样式
      row.getCell('itemNo').value = product.itemNo
      row.getCell('barcode').value = product.barcode
      row.getCell('category').value = product.category || '未分类'
      row.getCell('description').value = product.description
      row.getCell('cost').value = product.cost
      row.getCell('supplier').value = product.supplier
      row.getCell('color').value = product.color
      row.getCell('material').value = product.material
      row.getCell('productSize').value = product.productSize
      row.getCell('cartonSize').value = product.cartonSize
      row.getCell('cartonWeight').value = product.cartonWeight
      row.getCell('moq').value = product.moq
      row.getCell('link1688').value = product.link1688

      // 设置单元格对齐方式
      row.eachCell((cell, colNumber) => {
        cell.alignment = { 
          vertical: 'middle', 
          horizontal: colNumber === 5 || colNumber === 11 || colNumber === 12 ? 'right' : 'left' 
        }
      })
    })

    // 设置样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=products_${new Date().toISOString().split('T')[0]}.xlsx`
      }
    })
  } catch (error) {
    console.error('导出失败:', error)
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    )
  }
} 