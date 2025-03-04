import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon, Loader2, X } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import imageCompression from "browser-image-compression"
import { cn } from "@/lib/utils"

interface MultiImageUploadProps {
  onImagesSelected: (urls: string[]) => void
  maxImages?: number
  currentImages?: string[]
  onDeleteImage?: (url: string) => void
}

export function MultiImageUpload({
  onImagesSelected,
  maxImages = 5,
  currentImages = [],
  onDeleteImage
}: MultiImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const remainingSlots = maxImages - currentImages.length

  const compressImage = async (file: File) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    }

    try {
      const compressedFile = await imageCompression(file, options)
      return compressedFile
    } catch (error) {
      console.error("图片压缩失败:", error)
      throw error
    }
  }

  const uploadImage = async (file: File) => {
    try {
      // 如果图片大于1MB，进行压缩
      let processedFile = file
      if (file.size > 1024 * 1024) {
        processedFile = await compressImage(file)
      }

      const formData = new FormData()
      formData.append("file", processedFile)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("上传失败")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("上传失败:", error)
      throw error
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // 检查是否超过最大图片数量
    if (files.length > remainingSlots) {
      toast.error(`最多只能再上传 ${remainingSlots} 张图片`)
      return
    }

    setIsUploading(true)
    const uploadedUrls: string[] = []

    try {
      for (const file of files) {
        // 验证文件类型
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} 不是有效的图片文件`)
          continue
        }

        const url = await uploadImage(file)
        uploadedUrls.push(url)
      }

      if (uploadedUrls.length > 0) {
        onImagesSelected(uploadedUrls)
        toast.success(`成功上传 ${uploadedUrls.length} 张图片`)
      }
    } catch (error) {
      toast.error("上传图片时发生错误")
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      {/* 显示现有图片 */}
      {currentImages.map((imageUrl, index) => (
        <div key={index} className="relative group">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden">
            <Image
              src={imageUrl}
              alt={`图片 ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
          {onDeleteImage && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDeleteImage(imageUrl)}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      
      {/* 上传按钮 */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/*"
        onChange={handleFileSelect}
        disabled={isUploading || remainingSlots <= 0}
      />
      <Button
        variant="outline"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || remainingSlots <= 0}
        className={cn(
          "relative h-16 w-16 rounded-lg border-dashed",
          remainingSlots <= 0 && "opacity-50"
        )}
      >
        {isUploading ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <>
            <Plus className="h-6 w-6" />
            {remainingSlots > 0 && (
              <span className="absolute -bottom-6 text-xs text-muted-foreground whitespace-nowrap">
                还可添加{remainingSlots}张
              </span>
            )}
          </>
        )}
      </Button>
    </div>
  )
} 