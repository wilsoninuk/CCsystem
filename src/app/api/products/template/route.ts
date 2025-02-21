import { NextResponse } from "next/server"
import ExcelJS from 'exceljs'

export async function GET() {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('商品导入模板')

    // 设置列
    worksheet.columns = [
      { header: '商品图片', key: 'picture', width: 20 },
      { header: '商品编号*', key: 'itemNo', width: 15 },
      { header: '条形码*', key: 'barcode', width: 15 },
      { header: '商品描述*', key: 'description', width: 30 },
      { header: '成本*', key: 'cost', width: 10 },
      { header: '供应商', key: 'supplier', width: 15 },
      { header: '颜色/款式', key: 'color', width: 15 },
      { header: '材料', key: 'material', width: 15 },
      { header: '产品尺寸', key: 'productSize', width: 15 },
      { header: '装箱尺寸', key: 'cartonSize', width: 15 },
      { header: '装箱重量', key: 'cartonWeight', width: 10 },
      { header: 'MOQ', key: 'moq', width: 10 },
      { header: '1688链接', key: 'link1688', width: 30 },
    ]

    // 添加示例数据
    worksheet.addRow({
      picture: 'https://example.com/image.jpg',
      itemNo: 'ITEM001',
      barcode: '6901234567890',
      description: '示例商品',
      cost: 99.99,
      supplier: '示例供应商',
      color: '红色',
      material: '棉',
      productSize: '10x20x30cm',
      cartonSize: '30x40x50cm',
      cartonWeight: 1.5,
      moq: 100,
      link1688: 'https://detail.1688.com/xxx'
    })

    // 设置样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    }

    // 添加说明
    const noteSheet = workbook.addWorksheet('填写说明')
    noteSheet.addRow(['字段', '说明', '是否必填', '格式要求'])
    noteSheet.addRow(['商品图片', '商品图片URL地址', '否', 'http(s)开头的图片链接'])
    noteSheet.addRow(['商品编号', '商品唯一编号', '是', '字母数字组合'])
    noteSheet.addRow(['条形码', '商品条形码', '是', '13位数字'])
    noteSheet.addRow(['商品描述', '商品详细描述', '是', '文本'])
    noteSheet.addRow(['成本', '商品成本价格', '是', '数字，最多2位小数'])
    noteSheet.addRow(['供应商', '供应商名称', '否', '文本'])
    noteSheet.addRow(['颜色/款式', '商品颜色或款式', '否', '文本'])
    noteSheet.addRow(['材料', '商品材质', '否', '文本'])
    noteSheet.addRow(['产品尺寸', '单个产品尺寸', '否', '长x宽x高，单位cm'])
    noteSheet.addRow(['装箱尺寸', '外箱尺寸', '否', '长x宽x高，单位cm'])
    noteSheet.addRow(['装箱重量', '外箱重量', '否', '数字，单位kg'])
    noteSheet.addRow(['MOQ', '最小起订量', '否', '整数'])
    noteSheet.addRow(['1688链接', '1688商品链接', '否', 'http(s)开头的URL'])

    // 设置说明表样式
    noteSheet.getColumn(1).width = 15
    noteSheet.getColumn(2).width = 30
    noteSheet.getColumn(3).width = 15
    noteSheet.getColumn(4).width = 30
    noteSheet.getRow(1).font = { bold: true }

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=products_template.xlsx'
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