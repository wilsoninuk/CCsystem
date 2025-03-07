import { useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, Plus, Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ImageGalleryProps {
  mainImage: string | null
  additionalImages: string[]
  onMainImageChange: (url: string | null) => Promise<void>
  onAdditionalImagesChange: (urls: string[]) => Promise<void>
  disabled?: boolean
}

export function ImageGallery({
  mainImage,
  additionalImages,
  onMainImageChange,
  onAdditionalImagesChange,
  disabled
}: ImageGalleryProps) {
  const [newImageUrl, setNewImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [galleryOpen, setGalleryOpen] = useState(false)

  // 添加新图片
  const handleAddImage = async () => {
    if (!newImageUrl) return

    try {
      setIsLoading(true)
      // 如果没有主图，则设置为主图
      if (!mainImage) {
        await onMainImageChange(newImageUrl)
      } else {
        // 否则添加到附加图片
        await onAdditionalImagesChange([...additionalImages, newImageUrl])
      }
      setNewImageUrl("")
    } catch (error) {
      console.error("添加图片失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 删除图片
  const handleDeleteImage = async (index: number) => {
    if (!confirm("确定要删除这张图片吗？")) return

    try {
      setIsLoading(true)
      const newImages = [...additionalImages]
      newImages.splice(index, 1)
      await onAdditionalImagesChange(newImages)
    } catch (error) {
      console.error("删除图片失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 删除主图
  const handleDeleteMainImage = async () => {
    if (!confirm("确定要删除主图吗？")) return

    try {
      setIsLoading(true)
      await onMainImageChange(null)
    } catch (error) {
      console.error("删除主图失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 设置为主图
  const handleSetAsMain = async (imageUrl: string, index: number) => {
    try {
      setIsLoading(true)
      // 将当前主图添加到附加图片
      const newAdditionalImages = [...additionalImages]
      if (mainImage) {
        newAdditionalImages.push(mainImage)
      }
      // 从附加图片中移除将要设为主图的图片
      newAdditionalImages.splice(index, 1)
      
      // 更新主图和附加图片
      await onMainImageChange(imageUrl)
      await onAdditionalImagesChange(newAdditionalImages)
    } catch (error) {
      console.error("设置主图失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 图片添加区域 */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder="输入图片URL"
            value={newImageUrl}
            onChange={(e) => setNewImageUrl(e.target.value)}
            disabled={disabled || isLoading}
          />
        </div>
        <Button
          onClick={handleAddImage}
          disabled={!newImageUrl || disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* 图片预览区域 */}
      <div className="grid grid-cols-4 gap-4">
        {/* 主图 */}
        {mainImage && (
          <div className="relative group aspect-square">
            <Image
              src={mainImage}
              alt="主图"
              fill
              className="object-cover rounded-lg cursor-pointer"
              onClick={() => {
                setSelectedImage(mainImage)
                setGalleryOpen(true)
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleDeleteMainImage}
                disabled={disabled || isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <span className="absolute bottom-2 left-2 text-white text-xs bg-black/60 px-2 py-1 rounded">
                主图
              </span>
            </div>
          </div>
        )}

        {/* 附加图片 */}
        {additionalImages.map((imageUrl, index) => (
          <div key={index} className="relative group aspect-square">
            <Image
              src={imageUrl}
              alt={`附加图片 ${index + 1}`}
              fill
              className="object-cover rounded-lg cursor-pointer"
              onClick={() => {
                setSelectedImage(imageUrl)
                setGalleryOpen(true)
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => handleSetAsMain(imageUrl, index)}
                  disabled={disabled || isLoading}
                >
                  <span className="text-xs">主</span>
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDeleteImage(index)}
                  disabled={disabled || isLoading}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 图片查看对话框 */}
      <Dialog open={galleryOpen} onOpenChange={setGalleryOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>图片查看</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="relative aspect-video">
              <Image
                src={selectedImage}
                alt="查看图片"
                fill
                className="object-contain"
              />
            </div>
          )}
          {/* 缩略图导航 */}
          <div className="flex gap-2 overflow-x-auto py-2">
            {mainImage && (
              <button
                onClick={() => setSelectedImage(mainImage)}
                className={cn(
                  "relative w-20 aspect-square flex-shrink-0",
                  selectedImage === mainImage && "ring-2 ring-primary"
                )}
              >
                <Image
                  src={mainImage}
                  alt="主图"
                  fill
                  className="object-cover rounded"
                />
              </button>
            )}
            {additionalImages.map((imageUrl, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(imageUrl)}
                className={cn(
                  "relative w-20 aspect-square flex-shrink-0",
                  selectedImage === imageUrl && "ring-2 ring-primary"
                )}
              >
                <Image
                  src={imageUrl}
                  alt={`附加图片 ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 