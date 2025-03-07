import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      )
    }

    // 生成唯一文件名
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uniqueId = uuidv4()
    const extension = file.type.split("/")[1]
    const fileName = `${uniqueId}.${extension}`

    // 确保上传目录存在
    const uploadDir = join(process.cwd(), "public", "uploads")
    try {
      await writeFile(join(uploadDir, fileName), buffer)
    } catch (error) {
      console.error("Failed to save file:", error)
      return NextResponse.json(
        { error: "Failed to save file" },
        { status: 500 }
      )
    }

    // 返回文件URL
    const fileUrl = `/uploads/${fileName}`
    return NextResponse.json({ url: fileUrl })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    )
  }
} 