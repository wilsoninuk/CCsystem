import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from 'cloudinary'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// 配置Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

/**
 * 上传图片到Cloudinary
 * POST /api/upload/cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 解析FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const productId = formData.get('productId') as string
    const barcode = formData.get('barcode') as string
    const isMain = formData.get('isMain') === 'true'
    const index = formData.get('index') ? parseInt(formData.get('index') as string) : -1

    if (!file || !productId || !barcode) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 准备文件名 - 修复路径重复问题
    // 只使用barcode作为publicId，将products作为folder
    let publicId = isMain ? barcode : `${barcode}_${index + 1}`

    // 将文件转换为ArrayBuffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // 上传到Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          folder: 'products', // 使用products作为文件夹
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      )

      // 写入数据到流
      uploadStream.write(buffer)
      uploadStream.end()
    })

    return NextResponse.json({ success: true, data: uploadResult })
  } catch (error) {
    console.error('上传图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "上传图片失败" },
      { status: 500 }
    )
  }
}

/**
 * 从Cloudinary删除图片
 * DELETE /api/upload/cloudinary
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证用户是否已登录
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    // 解析请求体
    const body = await request.json()
    const { productId, barcode, isMain, index } = body

    if (!productId || !barcode) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 })
    }

    // 准备文件名 - 修复路径重复问题
    // 只使用barcode作为publicId，将products作为folder
    let publicId = isMain ? barcode : `${barcode}_${index + 1}`

    // 从Cloudinary删除图片
    const deleteResult = await cloudinary.uploader.destroy(`products/${publicId}`)

    if (deleteResult.result !== 'ok') {
      throw new Error(`删除图片失败: ${deleteResult.result}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除图片失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除图片失败" },
      { status: 500 }
    )
  }
} 