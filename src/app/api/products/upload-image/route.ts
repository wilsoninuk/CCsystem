import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import sharp from "sharp"
import path from "path"
import fs from "fs/promises"

// 配置
const UPLOAD_DIR = path.join(process.cwd(), 'public/uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const itemNo = formData.get('itemNo') as string

    console.log('Upload request:', { itemNo, fileType: file.type, fileSize: file.size })

    // 参数验证
    if (!file || !itemNo) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 文件类型检查
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: '不支持的文件类型，请上传 JPG、PNG、GIF 或 WebP 格式的图片' },
        { status: 400 }
      )
    }

    // 文件大小检查
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 商品编号验证
    const product = await prisma.product.findUnique({
      where: { itemNo }
    })
    if (!product) {
      return NextResponse.json(
        { success: false, error: '商品不存在' },
        { status: 404 }
      )
    }

    // 确保上传目录存在
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await fs.mkdir(uploadDir, { recursive: true })

    // 读取文件内容
    const buffer = Buffer.from(await file.arrayBuffer())

    // 验证文件是否为有效的图片
    try {
      const metadata = await sharp(buffer).metadata()
      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image')
      }
    } catch {
      return NextResponse.json(
        { success: false, error: '无效的图片文件' },
        { status: 400 }
      )
    }

    // 使用 sharp 处理图片
    const processedImage = await sharp(buffer)
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer()

    // 如果存在旧图片，删除它
    if (product.picture && product.picture.startsWith('/uploads/')) {
      const oldFilePath = path.join(process.cwd(), 'public', product.picture)
      try {
        await fs.unlink(oldFilePath)
      } catch (error) {
        console.error('删除旧图片失败:', error)
      }
    }

    // 生成安全的文件名
    const fileName = `${itemNo}-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`
    const filePath = path.join(uploadDir, fileName)

    // 生成访问 URL
    const imageUrl = `/uploads/${fileName}` // 先定义 imageUrl

    // 保存文件
    await fs.writeFile(filePath, processedImage)
    console.log('File saved:', { filePath, imageUrl })

    // 更新数据库
    const updatedProduct = await prisma.product.update({
      where: { itemNo },
      data: { picture: imageUrl }
    })
    console.log('Database updated:', updatedProduct)

    // 返回更新后的图片 URL
    return NextResponse.json({
      success: true,
      url: updatedProduct.picture
    })
  } catch (error) {
    console.error('Upload failed:', error)
    // 返回更详细的错误信息
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '上传失败',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 