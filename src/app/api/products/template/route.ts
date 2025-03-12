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
      { header: '1688链接', key: 'link1688', width: 30 }
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
      link1688: 'https://detail.1688.com/xxx'
    })

    // 添加说明行
    worksheet.addRow([])
    worksheet.addRow(['注意事项：'])
    worksheet.addRow(['1. 标记*的字段为必填项'])
    worksheet.addRow(['2. 条形码必须填写且不能重复，建议使用标准13位数字条形码'])
    worksheet.addRow(['3. 系统会根据条形码自动从Cloudinary获取图片，无需手动填写图片URL'])
    worksheet.addRow(['4. 数字字段（成本、箱重、最小订量）请填写数字，不要包含单位'])
    worksheet.addRow(['5. 图片命名规则：主图为"条形码.jpg"，附图为"条形码_1.jpg"、"条形码_2.jpg"等'])

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