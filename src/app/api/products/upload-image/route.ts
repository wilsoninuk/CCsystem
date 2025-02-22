import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

// 配置
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const productId = formData.get('productId') as string

    console.log('Upload request:', { productId, imageType: image?.type })

    if (!image || !productId) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 验证产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, picture: true }
    })

    if (!product) {
      return NextResponse.json(
        { error: '产品不存在' },
        { status: 404 }
      )
    }

    // 验证文件类型
    if (!ALLOWED_FILE_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小不能超过 5MB' },
        { status: 400 }
      )
    }

    // 生成文件名
    const fileName = `${productId}-${Date.now()}.jpg`
    const filePath = join(UPLOAD_DIR, fileName)

    // 处理图片
    const bytes = await image.arrayBuffer()
    const processedImage = await sharp(Buffer.from(bytes))
      .resize(800, 800, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality: 80,
        progressive: true
      })
      .toBuffer()

    // 保存图片
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(filePath, processedImage)

    // 从请求中获取实际的 host 和 protocol
    const host = request.headers.get('host') || 'localhost:3001'
    const protocol = request.headers.get('x-forwarded-proto') || 'http'
    const imageUrl = `${protocol}://${host}/uploads/${fileName}`

    // 更新数据库
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { picture: imageUrl },
      select: { id: true, picture: true }
    })

    return NextResponse.json({ 
      imageUrl: updatedProduct.picture,
      message: '上传成功' 
    })

  } catch (error) {
    console.error('上传失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
} 