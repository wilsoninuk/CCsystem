import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import ExcelJS from 'exceljs'
import axios from 'axios'
import { headers } from 'next/headers'
import { getProductMainImageUrl, getProductAdditionalImageUrls } from "@/lib/cloudinary"
import { updateExportProgress } from "@/app/api/export-progress/route"
import { v4 as uuidv4 } from 'uuid'

// 创建图片缓存，避免重复下载相同的图片
const imageCache: Record<string, Buffer> = {}

// 批量获取图片
async function getBatchImages(urls: string[]): Promise<Record<string, Buffer>> {
  const results: Record<string, Buffer> = {}
  
  // 使用Promise.allSettled并发获取所有图片
  const promises = urls.map(async (url) => {
    try {
      // 如果缓存中已有该图片，直接返回
      if (imageCache[url]) {
        return { url, buffer: imageCache[url] }
      }
      
      // 添加随机参数防止缓存
      const urlWithParam = url.includes('?') 
        ? `${url}&_t=${Date.now()}` 
        : `${url}?_t=${Date.now()}`
      
      // 尝试直接获取图片
      const response = await axios.get(urlWithParam, {
        responseType: 'arraybuffer',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
        timeout: 8000 // 8秒超时
      })
      
      const buffer = Buffer.from(response.data)
      
      // 缓存图片
      imageCache[url] = buffer
      
      return { url, buffer }
    } catch (error) {
      console.error(`获取图片失败: ${url}`, error)
      
      // 返回一个1x1像素的透明图片作为备用
      const transparentPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')
      return { url, buffer: transparentPixel }
    }
  })
  
  const settledResults = await Promise.allSettled(promises)
  
  // 处理结果
  settledResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results[result.value.url] = result.value.buffer
    }
  })
  
  return results
}

export async function GET(request: Request) {
  // 生成唯一的导出ID
  const exportId = uuidv4()
  
  // 初始化进度
  updateExportProgress(exportId, 0, '准备导出...', false)
  
  try {
    // 获取当前请求的URL，用于构建进度查询URL
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const progressUrl = `${baseUrl}/api/export-progress?id=${exportId}`
    
    // 首先返回进度查询URL
    const progressResponse = {
      exportId,
      progressUrl
    }
    
    // 更新进度：开始查询数据
    updateExportProgress(exportId, 5, '正在查询产品数据...', false)
    
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
    
    // 更新进度：数据查询完成
    updateExportProgress(exportId, 10, `已查询到 ${products.length} 个产品，准备创建Excel文件...`, false)
    
    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('商品列表')
    
    // 设置默认行高以适应图片
    worksheet.properties.defaultRowHeight = 60
    
    // 找出最多的附图数量 - 我们固定为4张附图
    const maxAdditionalImages = 4
    
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
    
    // 更新进度：开始收集图片URL
    updateExportProgress(exportId, 15, '正在收集图片URL...', false)
    
    // 收集所有图片URL
    const allImageUrls: string[] = []
    const productImageMap: Record<string, { mainImageUrl: string, additionalImageUrls: string[] }> = {}
    
    products.forEach(product => {
      const cloudinaryMainImageUrl = getProductMainImageUrl(product.barcode)
      const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(product.barcode, maxAdditionalImages)
      
      allImageUrls.push(cloudinaryMainImageUrl)
      allImageUrls.push(...cloudinaryAdditionalImageUrls)
      
      productImageMap[product.id] = {
        mainImageUrl: cloudinaryMainImageUrl,
        additionalImageUrls: cloudinaryAdditionalImageUrls
      }
    })
    
    // 更新进度：开始下载图片
    updateExportProgress(exportId, 20, `正在下载 ${allImageUrls.length} 张图片...`, false)
    
    // 批量获取所有图片
    const imageBuffers = await getBatchImages(allImageUrls)
    
    // 更新进度：图片下载完成
    updateExportProgress(exportId, 50, '图片下载完成，正在生成Excel文件...', false)
    
    // 添加数据并处理图片
    for (let i = 0; i < products.length; i++) {
      // 更新进度
      const progressPercent = 50 + Math.floor((i / products.length) * 40)
      updateExportProgress(exportId, progressPercent, `正在处理第 ${i + 1}/${products.length} 个产品...`, false)
      
      const product = products[i]
      const rowNumber = i + 2
      
      // 设置行高以适应图片
      worksheet.getRow(rowNumber).height = 60
      
      // 获取该产品的图片URL
      const { mainImageUrl, additionalImageUrls } = productImageMap[product.id]
      
      // 处理主图
      try {
        const imageBuffer = imageBuffers[mainImageUrl]
        if (imageBuffer) {
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowNumber - 1 },
            ext: { width: 80, height: 80 }
          })
        }
      } catch (error) {
        console.error('添加主图失败:', error)
      }
      
      // 处理附图
      for (let j = 0; j < maxAdditionalImages; j++) {
        try {
          const additionalImageUrl = additionalImageUrls[j]
          const imageBuffer = imageBuffers[additionalImageUrl]
          
          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer as any,
              extension: 'jpeg'
            })
            worksheet.addImage(imageId, {
              tl: { col: baseColumns.length + j, row: rowNumber - 1 },
              ext: { width: 80, height: 80 }
            })
          }
        } catch (error) {
          console.error(`添加附图${j + 1}失败:`, error)
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
    
    // 更新进度：开始生成Excel文件
    updateExportProgress(exportId, 90, '正在生成Excel文件...', false)
    
    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()
    
    // 生成文件名
    const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // 更新进度：导出完成
    updateExportProgress(exportId, 100, '导出完成', true, fileName)
    
    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`
      }
    })
  } catch (error) {
    console.error('导出失败:', error)
    
    // 更新进度：导出失败
    updateExportProgress(exportId, 100, `导出失败: ${error instanceof Error ? error.message : '未知错误'}`, true)
    
    return NextResponse.json(
      { error: '导出失败', exportId },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // 生成唯一的导出ID
  const exportId = uuidv4()
  
  // 初始化进度
  updateExportProgress(exportId, 0, '准备导出...', false)
  
  try {
    // 获取当前请求的URL，用于构建进度查询URL
    const requestUrl = new URL(request.url)
    const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`
    const progressUrl = `${baseUrl}/api/export-progress?id=${exportId}`
    
    // 解析请求体
    const { ids } = await request.json()
    
    // 首先返回进度查询URL
    const progressResponse = {
      exportId,
      progressUrl
    }
    
    // 更新进度：开始查询数据
    updateExportProgress(exportId, 5, '正在查询产品数据...', false)
    
    // 构建查询条件
    const where = ids?.length ? { id: { in: ids } } : {}
    
    // 获取产品及其图片
    const products = await prisma.product.findMany({
      where,
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
    
    // 更新进度：数据查询完成
    updateExportProgress(exportId, 10, `已查询到 ${products.length} 个产品，准备创建Excel文件...`, false)
    
    // 创建工作簿和工作表
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('商品列表')
    
    // 设置默认行高以适应图片
    worksheet.properties.defaultRowHeight = 60
    
    // 找出最多的附图数量 - 我们固定为4张附图
    const maxAdditionalImages = 4
    
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
    
    // 更新进度：开始收集图片URL
    updateExportProgress(exportId, 15, '正在收集图片URL...', false)
    
    // 收集所有图片URL
    const allImageUrls: string[] = []
    const productImageMap: Record<string, { mainImageUrl: string, additionalImageUrls: string[] }> = {}
    
    products.forEach(product => {
      const cloudinaryMainImageUrl = getProductMainImageUrl(product.barcode)
      const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(product.barcode, maxAdditionalImages)
      
      allImageUrls.push(cloudinaryMainImageUrl)
      allImageUrls.push(...cloudinaryAdditionalImageUrls)
      
      productImageMap[product.id] = {
        mainImageUrl: cloudinaryMainImageUrl,
        additionalImageUrls: cloudinaryAdditionalImageUrls
      }
    })
    
    // 更新进度：开始下载图片
    updateExportProgress(exportId, 20, `正在下载 ${allImageUrls.length} 张图片...`, false)
    
    // 批量获取所有图片
    const imageBuffers = await getBatchImages(allImageUrls)
    
    // 更新进度：图片下载完成
    updateExportProgress(exportId, 50, '图片下载完成，正在生成Excel文件...', false)
    
    // 添加数据并处理图片
    for (let i = 0; i < products.length; i++) {
      // 更新进度
      const progressPercent = 50 + Math.floor((i / products.length) * 40)
      updateExportProgress(exportId, progressPercent, `正在处理第 ${i + 1}/${products.length} 个产品...`, false)
      
      const product = products[i]
      const rowNumber = i + 2
      
      // 设置行高以适应图片
      worksheet.getRow(rowNumber).height = 60
      
      // 获取该产品的图片URL
      const { mainImageUrl, additionalImageUrls } = productImageMap[product.id]
      
      // 处理主图
      try {
        const imageBuffer = imageBuffers[mainImageUrl]
        if (imageBuffer) {
          const imageId = workbook.addImage({
            buffer: imageBuffer as any,
            extension: 'jpeg'
          })
          worksheet.addImage(imageId, {
            tl: { col: 0, row: rowNumber - 1 },
            ext: { width: 80, height: 80 }
          })
        }
      } catch (error) {
        console.error('添加主图失败:', error)
      }
      
      // 处理附图
      for (let j = 0; j < maxAdditionalImages; j++) {
        try {
          const additionalImageUrl = additionalImageUrls[j]
          const imageBuffer = imageBuffers[additionalImageUrl]
          
          if (imageBuffer) {
            const imageId = workbook.addImage({
              buffer: imageBuffer as any,
              extension: 'jpeg'
            })
            worksheet.addImage(imageId, {
              tl: { col: baseColumns.length + j, row: rowNumber - 1 },
              ext: { width: 80, height: 80 }
            })
          }
        } catch (error) {
          console.error(`添加附图${j + 1}失败:`, error)
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
    
    // 更新进度：开始生成Excel文件
    updateExportProgress(exportId, 90, '正在生成Excel文件...', false)
    
    // 生成 Excel 文件
    const buffer = await workbook.xlsx.writeBuffer()
    
    // 生成文件名
    const fileName = `products_${new Date().toISOString().split('T')[0]}.xlsx`
    
    // 更新进度：导出完成
    updateExportProgress(exportId, 100, '导出完成', true, fileName)
    
    // 返回文件
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=${fileName}`
      }
    })
  } catch (error) {
    console.error('导出失败:', error)
    
    // 更新进度：导出失败
    updateExportProgress(exportId, 100, `导出失败: ${error instanceof Error ? error.message : '未知错误'}`, true)
    
    return NextResponse.json(
      { error: '导出失败', exportId },
      { status: 500 }
    )
  }
} 