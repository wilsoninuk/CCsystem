import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import sharp from 'sharp'

// 最大文件大小 1MB
const MAX_FILE_SIZE = 1024 * 1024

// 压缩图片
async function compressImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({
      quality: 80,
      progressive: true
    })
    .toBuffer()
}

// 检查是否为图片
function isImage(file: File) {
  return file.type.startsWith('image/')
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户权限
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const isMain = formData.get('isMain') === 'true'

    // 验证产品是否存在
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { images: true }
    })

    if (!product) {
      return NextResponse.json({ error: '产品不存在' }, { status: 404 })
    }

    // 验证图片数量
    if (product.images.length + files.length > 5) {
      return NextResponse.json(
        { error: '最多只能上传5张图片' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const file of files) {
      try {
        // 验证文件类型
        if (!isImage(file)) {
          errors.push(`文件 ${file.name} 不是图片`)
          continue
        }

        // 读取文件内容
        const buffer = Buffer.from(await file.arrayBuffer())

        // 如果文件大于1MB，进行压缩
        const processedBuffer = buffer.length > MAX_FILE_SIZE
          ? await compressImage(buffer)
          : buffer

        // TODO: 这里应该添加将图片上传到云存储的代码
        // 目前我们假设有一个上传服务，返回图片URL
        const imageUrl = `https://your-cloud-storage.com/${file.name}`

        // 创建图片记录
        const image = await prisma.productImage.create({
          data: {
            url: imageUrl,
            isMain: isMain && results.length === 0, // 只有第一张图片可以是主图
            order: product.images.length + results.length,
            productId: params.id
          }
        })

        results.push(image)
      } catch (error) {
        errors.push(`处理文件 ${file.name} 时出错: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      images: results,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('上传图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '上传失败' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json({ error: '缺少图片ID' }, { status: 400 })
    }

    // 验证图片是否属于该产品
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: params.id
      }
    })

    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 })
    }

    // 删除图片
    await prisma.productImage.delete({
      where: { id: imageId }
    })

    // TODO: 这里应该添加从云存储删除图片的代码

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '未授权访问' }, { status: 401 })
    }

    const { imageId, isMain, order } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: '缺少图片ID' }, { status: 400 })
    }

    // 验证图片是否属于该产品
    const image = await prisma.productImage.findFirst({
      where: {
        id: imageId,
        productId: params.id
      }
    })

    if (!image) {
      return NextResponse.json({ error: '图片不存在' }, { status: 404 })
    }

    // 如果设置为主图，需要将其他图片的主图标志取消
    if (isMain) {
      await prisma.productImage.updateMany({
        where: {
          productId: params.id,
          NOT: { id: imageId }
        },
        data: { isMain: false }
      })
    }

    // 更新图片信息
    const updatedImage = await prisma.productImage.update({
      where: { id: imageId },
      data: {
        isMain: isMain ?? image.isMain,
        order: order ?? image.order
      }
    })

    return NextResponse.json({ success: true, image: updatedImage })
  } catch (error) {
    console.error('更新图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '更新失败' },
      { status: 500 }
    )
  }
} 