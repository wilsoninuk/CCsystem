"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  productId: string
  currentImage: string | null
  onUploadSuccess: (newImageUrl: string) => void
}

export function ImageUpload({ productId, currentImage, onUploadSuccess }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 验证文件大小（例如最大 5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB')
      return
    }

    try {
      setIsUploading(true)
      console.log('开始上传文件:', file.name) // 添加日志

      const formData = new FormData()
      formData.append('image', file)
      formData.append('productId', productId)

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
      })

      console.log('上传响应:', response.status) // 添加日志

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '上传失败')
      }

      const data = await response.json()
      toast.success('图片上传成功')
      
      // 直接调用回调，让父组件处理刷新
      onUploadSuccess(data.imageUrl)
    } catch (error) {
      console.error('上传失败:', error)
      toast.error(error instanceof Error ? error.message : '上传失败')
    } finally {
      setIsUploading(false)
      event.target.value = '' // 重置文件输入
    }
  }

  return (
    <div className="relative" onClick={() => console.log('点击上传区域')}>
      <Button 
        variant="ghost" 
        size="icon" 
        disabled={isUploading}
        onClick={() => console.log('点击按钮')}
      >
        <Upload className="h-4 w-4" />
      </Button>
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="image/*"
        onChange={(e) => {
          console.log('选择文件:', e.target.files?.[0]?.name)
          handleUpload(e)
        }}
        disabled={isUploading}
        onClick={(e) => {
          e.stopPropagation()
          console.log('点击文件输入')
        }}
      />
    </div>
  )
} 