'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Image from 'next/image'
import { 
  Card, 
  CardContent,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton
} from '@mui/material'
import { 
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  DragHandle as DragHandleIcon
} from '@mui/icons-material'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'

interface ProductImage {
  id: string
  url: string
  isMain: boolean
  order: number
}

interface Props {
  productId: string
  images: ProductImage[]
  onImagesChange: (images: ProductImage[]) => void
  maxImages?: number
}

export default function ProductImageUpload({ 
  productId, 
  images, 
  onImagesChange,
  maxImages = 5
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // 处理图片拖放上传
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (images.length + acceptedFiles.length > maxImages) {
      alert(`最多只能上传${maxImages}张图片`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      acceptedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('上传失败')
      }

      const result = await response.json()
      onImagesChange([...images, ...result.images])
    } catch (error) {
      console.error('上传图片失败:', error)
      alert('上传图片失败')
    } finally {
      setUploading(false)
    }
  }, [productId, images, maxImages, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  // 处理图片删除
  const handleDelete = async (imageId: string) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/images?imageId=${imageId}`,
        { method: 'DELETE' }
      )

      if (!response.ok) {
        throw new Error('删除失败')
      }

      onImagesChange(images.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('删除图片失败:', error)
      alert('删除图片失败')
    }
  }

  // 处理设置主图
  const handleSetMain = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${productId}/images`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageId,
          isMain: true
        })
      })

      if (!response.ok) {
        throw new Error('设置主图失败')
      }

      onImagesChange(
        images.map(img => ({
          ...img,
          isMain: img.id === imageId
        }))
      )
    } catch (error) {
      console.error('设置主图失败:', error)
      alert('设置主图失败')
    }
  }

  // 处理图片排序
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const reorderedImages = Array.from(images)
    const [movedImage] = reorderedImages.splice(result.source.index, 1)
    reorderedImages.splice(result.destination.index, 0, movedImage)

    // 更新顺序
    const updatedImages = reorderedImages.map((img, index) => ({
      ...img,
      order: index
    }))

    try {
      // 更新每个图片的顺序
      await Promise.all(
        updatedImages.map(img =>
          fetch(`/api/products/${productId}/images`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              imageId: img.id,
              order: img.order
            })
          })
        )
      )

      onImagesChange(updatedImages)
    } catch (error) {
      console.error('更新图片顺序失败:', error)
      alert('更新图片顺序失败')
    }
  }

  return (
    <div className="space-y-4">
      {/* 上传区域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} disabled={uploading} />
        {uploading ? (
          <p>上传中...</p>
        ) : isDragActive ? (
          <p>将图片拖放到此处</p>
        ) : (
          <p>点击或将图片拖放到此处上传（最多{maxImages}张）</p>
        )}
      </div>

      {/* 图片列表 */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="images" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex flex-wrap gap-4"
            >
              {images
                .sort((a, b) => a.order - b.order)
                .map((image, index) => (
                  <Draggable
                    key={image.id}
                    draggableId={image.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                      >
                        <Card className="relative w-40">
                          <div {...provided.dragHandleProps}>
                            <DragHandleIcon className="absolute top-2 left-2 text-white" />
                          </div>
                          <CardContent className="p-2">
                            <div className="relative">
                              <Image
                                src={image.url}
                                alt="Product"
                                width={150}
                                height={150}
                                className="rounded cursor-pointer"
                                onClick={() => setPreviewUrl(image.url)}
                              />
                              <div className="absolute top-0 right-0 space-x-1">
                                <IconButton
                                  size="small"
                                  onClick={() => handleSetMain(image.id)}
                                >
                                  {image.isMain ? (
                                    <StarIcon className="text-yellow-500" />
                                  ) : (
                                    <StarBorderIcon />
                                  )}
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(image.id)}
                                >
                                  <DeleteIcon className="text-red-500" />
                                </IconButton>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* 图片预览对话框 */}
      <Dialog
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        maxWidth="lg"
      >
        <DialogTitle>图片预览</DialogTitle>
        <DialogContent>
          {previewUrl && (
            <Image
              src={previewUrl}
              alt="Preview"
              width={800}
              height={800}
              className="object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 