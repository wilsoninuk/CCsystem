import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import ExcelJS from 'exceljs'
import axios from 'axios'
import { headers } from 'next/headers'

export async function GET() {
  try {
    // 获取当前请求的host，用于构建完整的图片URL
    const headersList = headers()
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
    const host = headersList.get('host') || ''
    const baseUrl = `${protocol}://${host}`

    // 获取所有产品及其图片
    const products = await prisma.product.findMany({
      include: {
        images: true,
        creator: {
          select: {
            name: true
          }
        },
        updater: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('商品列表')

    // 找出最多的附图数量
    const maxAdditionalImages = Math.max(...products.map(p => 
      p.images.filter(img => !img.isMain).length
    ))

    // 设置列宽
    const baseColumns = [
      { header: '主图', key: 'mainImage', width: 15 },
      { header: '商品编号', key: 'itemNo', width: 15 },
      { header: '条形码', key: 'barcode', width: 15 },
      { header: '商品描述', key: 'description', width: 30 },
      { header: '类别', key: 'category', width: 15 },
      { header: '成本', key: 'cost', width: 10 },
      { header: '供应商', key: 'supplier', width: 15 },
      { header: '颜色/款式', key: 'color', width: 15 },
      { header: '材料', key: 'material', width: 15 },
      { header: '产品尺寸', key: 'productSize', width: 15 },
      { header: '装箱尺寸', key: 'cartonSize', width: 15 },
      { header: '装箱重量', key: 'cartonWeight', width: 10 },
      { header: 'MOQ', key: 'moq', width: 10 },
      { header: '1688链接', key: 'link1688', width: 30 },
      { header: '创建者', key: 'creator', width: 15 },
      { header: '创建时间', key: 'createdAt', width: 20 },
      { header: '最后修改者', key: 'updater', width: 15 },
      { header: '最后修改时间', key: 'updatedAt', width: 20 }
    ]

    // 添加附图列
    const additionalImageColumns = Array.from({ length: maxAdditionalImages }, (_, i) => ({
      header: `附图${i + 1}`,
      key: `additionalImage${i}`,
      width: 15
    }))

    worksheet.columns = [...baseColumns, ...additionalImageColumns]

    // 设置表头样式
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    // 添加数据并处理图片
    for (let i = 0; i < products.length; i++) {
      const product = products[i]
      const rowNumber = i + 2
      const mainImage = product.images.find(img => img.isMain)
      const additionalImages = product.images.filter(img => !img.isMain)

      // 设置行高以适应图片
      worksheet.getRow(rowNumber).height = 60

      // 获取完整的图片URL
      const getFullImageUrl = (url: string) => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          return url
        }
        return `${baseUrl}${url}`
      }

      // 处理主图
      if (mainImage) {
        try {
          const fullImageUrl = getFullImageUrl(mainImage.url)
          const response = await axios.get(fullImageUrl, {
            responseType: 'arraybuffer'
          })
          const imageId = workbook.addImage({
            buffer: response.data,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowNumber - 1 },
            ext: { width: 80, height: 80 }
          })
        } catch (error) {
          console.error('下载主图失败:', error)
        }
      }

      // 处理附图
      for (let j = 0; j < additionalImages.length; j++) {
        try {
          const fullImageUrl = getFullImageUrl(additionalImages[j].url)
          const response = await axios.get(fullImageUrl, {
            responseType: 'arraybuffer'
          })
          const imageId = workbook.addImage({
            buffer: response.data,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: baseColumns.length + j, row: rowNumber - 1 },
            ext: { width: 80, height: 80 }
          })
        } catch (error) {
          console.error(`下载附图${j + 1}失败:`, error)
        }
      }

      // 添加其他数据
      const rowValues = [
        '', // 主图列留空，因为我们已经添加了图片
        product.itemNo,
        product.barcode,
        product.description,
        product.category || '',
        product.cost,
        product.supplier || '',
        product.color || '',
        product.material || '',
        product.productSize || '',
        product.cartonSize || '',
        product.cartonWeight || '',
        product.moq || '',
        product.link1688 || '',
        product.creator?.name || '',
        new Date(product.createdAt).toLocaleString('zh-CN'),
        product.updater?.name || '',
        new Date(product.updatedAt).toLocaleString('zh-CN')
      ]

      // 为附图列添加空值
      for (let j = 0; j < maxAdditionalImages; j++) {
        rowValues.push('')
      }

      worksheet.getRow(rowNumber).values = rowValues

      // 设置单元格样式
      worksheet.getRow(rowNumber).alignment = { vertical: 'middle', horizontal: 'center' }
    }

    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()

    // 返回文件
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