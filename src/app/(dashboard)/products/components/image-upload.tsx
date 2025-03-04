"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { toast } from "sonner"

export interface ImageUploadProps {
  onUpload: (url: string) => Promise<void>
  text: string
}

export function ImageUpload({ onUpload, text }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }

    // 检查文件大小（5MB限制）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }

    try {
      setIsUploading(true)

      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const data = await response.json()
      await onUpload(data.url)
      
      // 清除文件选择
      event.target.value = ''
    } catch (error) {
      console.error('上传失败:', error)
      toast.error('上传失败')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <Button
        variant="outline"
        className="w-full h-24 border-dashed"
        disabled={isUploading}
      >
        <div className="flex flex-col items-center justify-center">
          <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isUploading ? '上传中...' : text}
          </span>
        </div>
      </Button>
    </div>
  )
} 