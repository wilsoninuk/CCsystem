import { NextResponse } from "next/server"

// 使用内存存储导出进度
// 在生产环境中，应该使用Redis等分布式存储
const exportProgressStore: Record<string, {
  progress: number
  status: string
  isCompleted: boolean
  fileName?: string
  timestamp: number
}> = {}

// 清理过期的进度记录（30分钟后）
const cleanupExpiredProgress = () => {
  const now = Date.now()
  const expirationTime = 30 * 60 * 1000 // 30分钟
  
  Object.keys(exportProgressStore).forEach(key => {
    if (now - exportProgressStore[key].timestamp > expirationTime) {
      delete exportProgressStore[key]
    }
  })
}

// 每10分钟清理一次
setInterval(cleanupExpiredProgress, 10 * 60 * 1000)

// 获取导出进度
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: '缺少ID参数' }, { status: 400 })
  }
  
  const progressData = exportProgressStore[id]
  
  if (!progressData) {
    return NextResponse.json({ error: '未找到导出进度' }, { status: 404 })
  }
  
  return NextResponse.json(progressData)
}

// 更新导出进度
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, progress, status, isCompleted, fileName } = body
    
    if (!id) {
      return NextResponse.json({ error: '缺少ID参数' }, { status: 400 })
    }
    
    exportProgressStore[id] = {
      progress: progress || 0,
      status: status || '准备中...',
      isCompleted: isCompleted || false,
      fileName,
      timestamp: Date.now()
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('更新导出进度失败:', error)
    return NextResponse.json({ error: '更新导出进度失败' }, { status: 500 })
  }
}

// 导出函数，用于在服务器端更新进度
export function updateExportProgress(id: string, progress: number, status: string, isCompleted = false, fileName?: string) {
  exportProgressStore[id] = {
    progress,
    status,
    isCompleted,
    fileName,
    timestamp: Date.now()
  }
} 