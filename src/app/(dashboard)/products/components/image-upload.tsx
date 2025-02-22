"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

      const formData = new FormData()
      formData.append('image', file)
      formData.append('productId', productId)

      const response = await fetch('/api/products/upload-image', {
        method: 'POST',
        body: formData,
      })

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
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-block">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id={`image-upload-${productId}`}
              onChange={handleUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor={`image-upload-${productId}`}
              className="cursor-pointer inline-block"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </label>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{currentImage ? '更换图片' : '上传图片'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 