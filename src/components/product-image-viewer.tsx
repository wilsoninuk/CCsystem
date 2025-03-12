import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getProductMainImageUrl, getProductAdditionalImageUrls } from "@/lib/cloudinary"
import { useState, useEffect } from "react"
import { PlaceholderImage } from "@/components/ui/placeholder-image"
import { Button } from "@/components/ui/button"
import { RefreshCw, Upload, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ProductImageViewerProps {
  product: {
    id: string
    barcode: string
    description: string
    itemNo?: string
    category?: string
    images?: Array<{ id: string, url: string, isMain: boolean }>
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  forceRefresh?: boolean | number
}

export function ProductImageViewer({ 
  product, 
  open, 
  onOpenChange,
  forceRefresh = false
}: ProductImageViewerProps) {
  // 获取Cloudinary图片URL
  const cloudinaryMainImageUrl = getProductMainImageUrl(product.barcode)
  const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(product.barcode)
  
  // 图片加载状态
  const [mainImageLoaded, setMainImageLoaded] = useState(false)
  const [mainImageError, setMainImageError] = useState(false)
  const [additionalImagesLoaded, setAdditionalImagesLoaded] = useState<boolean[]>([false, false, false, false])
  const [additionalImagesError, setAdditionalImagesError] = useState<boolean[]>([false, false, false, false])
  
  // 图片操作状态
  const [refreshTimestamp, setRefreshTimestamp] = useState<number>(
    typeof forceRefresh === 'number' ? forceRefresh : (forceRefresh ? new Date().getTime() : 0)
  )

  // 当对话框打开时重置加载状态
  useEffect(() => {
    if (open) {
      setMainImageLoaded(false)
      setMainImageError(false)
      setAdditionalImagesLoaded([false, false, false, false])
      setAdditionalImagesError([false, false, false, false])
    }
  }, [open])
  
  // 当forceRefresh变化时更新refreshTimestamp
  useEffect(() => {
    if (forceRefresh) {
      setRefreshTimestamp(
        typeof forceRefresh === 'number' ? forceRefresh : new Date().getTime()
      )
    }
  }, [forceRefresh])

  // 处理主图加载状态
  const handleMainImageLoad = () => {
    setMainImageLoaded(true)
    setMainImageError(false)
  }
  
  const handleMainImageError = () => {
    setMainImageLoaded(false)
    setMainImageError(true)
  }
  
  // 处理附图加载状态
  const handleAdditionalImageLoad = (index: number) => {
    setAdditionalImagesLoaded(prev => {
      const newState = [...prev]
      newState[index] = true
      return newState
    })
    setAdditionalImagesError(prev => {
      const newState = [...prev]
      newState[index] = false
      return newState
    })
  }
  
  const handleAdditionalImageError = (index: number) => {
    setAdditionalImagesLoaded(prev => {
      const newState = [...prev]
      newState[index] = false
      return newState
    })
    setAdditionalImagesError(prev => {
      const newState = [...prev]
      newState[index] = true
      return newState
    })
  }
  
  // 强制刷新图片
  const refreshImage = (type: 'main' | 'additional', index: number = -1) => {
    const timestamp = new Date().getTime()
    setRefreshTimestamp(timestamp)
    
    if (type === 'main') {
      setMainImageLoaded(false)
      setMainImageError(false)
    } else if (index >= 0) {
      setAdditionalImagesLoaded(prev => {
        const newState = [...prev]
        newState[index] = false
        return newState
      })
      setAdditionalImagesError(prev => {
        const newState = [...prev]
        newState[index] = false
        return newState
      })
    }
    
    // 使用window.Image对象预加载图片并监听加载完成事件
    const img = new window.Image()
    
    img.onload = () => {
      // 图片加载成功后更新状态
      if (type === 'main') {
        setMainImageLoaded(true)
        setMainImageError(false)
      } else if (index >= 0) {
        setAdditionalImagesLoaded(prev => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
        setAdditionalImagesError(prev => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
      }
      toast.success('图片刷新成功')
    }
    
    img.onerror = () => {
      // 图片加载失败后更新状态
      if (type === 'main') {
        setMainImageLoaded(false)
        setMainImageError(true)
      } else if (index >= 0) {
        setAdditionalImagesLoaded(prev => {
          const newState = [...prev]
          newState[index] = false
          return newState
        })
        setAdditionalImagesError(prev => {
          const newState = [...prev]
          newState[index] = true
          return newState
        })
      }
      toast.error('图片刷新失败')
    }
    
    // 设置图片源并开始加载
    const url = type === 'main' 
      ? cloudinaryMainImageUrl 
      : cloudinaryAdditionalImageUrls[index]
    
    img.src = `${url}?t=${timestamp}&force=true`
    
    toast.success('正在刷新图片...')
    
    // 更新DOM中的图片元素
    setTimeout(() => {
      const imgElements = document.querySelectorAll(`img[src^="${url}"]`)
      imgElements.forEach(imgEl => {
        if (imgEl instanceof HTMLImageElement) {
          imgEl.src = img.src
        }
      })
    }, 100)
  }

  // 获取数据库中的主图和附图（作为备用）
  const dbMainImage = product.images?.find(img => img.isMain)?.url
  const dbAdditionalImages = product.images?.filter(img => !img.isMain).map(img => img.url) || []
  
  // 添加时间戳到URL
  const getUrlWithTimestamp = (url: string) => {
    return refreshTimestamp ? `${url}?t=${refreshTimestamp}` : url
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>商品图片</DialogTitle>
          <div className="mt-2 space-y-1 text-sm">
            {product.itemNo && <p><span className="font-medium">商品编号:</span> {product.itemNo}</p>}
            <p><span className="font-medium">条形码:</span> {product.barcode}</p>
            <p><span className="font-medium">描述:</span> {product.description}</p>
            {product.category && <p><span className="font-medium">类别:</span> {product.category}</p>}
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4">
          {/* 主图 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">主图</h3>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refreshImage('main')}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>刷新</span>
              </Button>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-lg">
              {!mainImageError ? (
                <>
                  <img
                    src={getUrlWithTimestamp(cloudinaryMainImageUrl)}
                    alt="主图"
                    className={`w-full h-full object-cover ${mainImageLoaded ? 'block' : 'hidden'}`}
                    onLoad={handleMainImageLoad}
                    onError={handleMainImageError}
                  />
                  {!mainImageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                      <span className="text-sm text-gray-500">加载中...</span>
                    </div>
                  )}
                </>
              ) : dbMainImage ? (
                <img
                  src={dbMainImage}
                  alt="主图"
                  className="w-full h-full object-cover"
                />
              ) : (
                <PlaceholderImage className="w-full h-full" />
              )}
            </div>
            <div className="mt-4 p-2 bg-gray-50 rounded-md">
              <p className="text-xs font-medium mb-1">图片URL:</p>
              <div className="overflow-x-auto">
                <code className="text-xs break-all">{cloudinaryMainImageUrl}</code>
              </div>
            </div>
          </div>
          
          {/* 附图 */}
          <div>
            <h3 className="text-lg font-medium mb-2">附图</h3>
            <div className="grid grid-cols-2 gap-2">
              {cloudinaryAdditionalImageUrls.map((url, index) => (
                <div key={`cloudinary-${index}`} className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">附图 {index + 1}</span>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => refreshImage('additional', index)}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    {!additionalImagesError[index] ? (
                      <>
                        <img
                          src={getUrlWithTimestamp(url)}
                          alt={`附图 ${index + 1}`}
                          className={`w-full h-full object-cover ${additionalImagesLoaded[index] ? 'block' : 'hidden'}`}
                          onLoad={() => handleAdditionalImageLoad(index)}
                          onError={() => handleAdditionalImageError(index)}
                        />
                        {!additionalImagesLoaded[index] && (
                          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                            <span className="text-sm text-gray-500">加载中...</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <PlaceholderImage className="w-full h-full" />
                    )}
                  </div>
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium mb-1">图片URL:</p>
                    <div className="overflow-x-auto">
                      <code className="text-xs break-all">{url}</code>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}