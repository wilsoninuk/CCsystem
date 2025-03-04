import { NextResponse } from "next/server"
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('产品导入模板')

    // 设置列
    worksheet.columns = [
      { header: '商品编号*', key: 'itemNo', width: 15 },
      { header: '条形码*', key: 'barcode', width: 20 },
      { header: '商品描述*', key: 'description', width: 40 },
      { header: '成本*', key: 'cost', width: 10 },
      { header: '类别', key: 'category', width: 15 },
      { header: '供应商', key: 'supplier', width: 20 },
      { header: '颜色', key: 'color', width: 15 },
      { header: '材质', key: 'material', width: 15 },
      { header: '产品尺寸', key: 'productSize', width: 15 },
      { header: '箱规', key: 'cartonSize', width: 15 },
      { header: '箱重', key: 'cartonWeight', width: 10 },
      { header: '最小订量', key: 'moq', width: 10 },
      { header: '1688链接', key: 'link1688', width: 30 },
      { header: '主图URL', key: 'mainImage', width: 30 },
      { header: '附图URL1', key: 'image1', width: 30 },
      { header: '附图URL2', key: 'image2', width: 30 },
      { header: '附图URL3', key: 'image3', width: 30 },
      { header: '附图URL4', key: 'image4', width: 30 }
    ]

    // 设置标题行样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // 添加示例数据
    worksheet.addRow({
      itemNo: 'ABC123',
      barcode: '6901234567890',
      description: '示例商品描述',
      cost: 100,
      category: '示例类别',
      supplier: '示例供应商',
      color: '红色',
      material: '塑料',
      productSize: '10x20x30cm',
      cartonSize: '100x200x300cm',
      cartonWeight: 5.5,
      moq: 1000,
      link1688: 'https://detail.1688.com/xxx',
      mainImage: 'https://example.com/main.jpg',
      image1: 'https://example.com/1.jpg',
      image2: 'https://example.com/2.jpg',
      image3: 'https://example.com/3.jpg',
      image4: 'https://example.com/4.jpg'
    })

    // 添加说明行
    worksheet.addRow([])
    worksheet.addRow(['注意事项：'])
    worksheet.addRow(['1. 标记*的字段为必填项'])
    worksheet.addRow(['2. 条形码必须填写且不能重复，建议使用标准13位数字条形码'])
    worksheet.addRow(['3. 图片URL需要是可以直接访问的完整链接'])
    worksheet.addRow(['4. 每个产品最多支持1张主图和4张附图'])
    worksheet.addRow(['5. 数字字段（成本、箱重、最小订量）请填写数字，不要包含单位'])

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=product_import_template.xlsx'
      }
    })
  } catch (error) {
    console.error('生成模板失败:', error)
    return NextResponse.json(
      { error: '生成模板失败' },
      { status: 500 }
    )
  }
} 