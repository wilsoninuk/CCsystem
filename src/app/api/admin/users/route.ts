import { prisma } from "@/lib/db"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

const ADMIN_EMAIL = "wilsoninuk@gmail.com"

// 获取用户列表
export async function GET(request: Request) {
  try {
    // 检查是否是管理员
    const session = await getServerSession(authOptions)
    if (session?.user?.email !== ADMIN_EMAIL) {
      return new Response("Unauthorized", { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("获取用户列表失败:", error)
    return NextResponse.json(
      { error: "获取用户列表失败" },
      { status: 500 }
    )
  }
}

// 创建新用户
export async function POST(request: Request) {
  try {
    // 检查是否是管理员
    const session = await getServerSession(authOptions)
    if (session?.user?.email !== ADMIN_EMAIL) {
      return new Response("Unauthorized", { status: 401 })
    }

    const { name, email, password } = await request.json()
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
    })
  } catch (error) {
    console.error("创建用户失败:", error)
    return NextResponse.json(
      { error: "创建用户失败" },
      { status: 500 }
    )
  }
} 