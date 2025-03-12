"use client"

import { cn } from "@/lib/utils"
import { PlaceholderImage } from "@/components/ui/placeholder-image"
import { useState, useEffect, useRef } from "react"
import { ProductImageViewer } from "@/components/product-image-viewer"
import { getProductMainImageUrl } from "@/lib/cloudinary"

export interface ProductImageProps {
  product?: {
    id: string
    barcode: string
    description: string
    itemNo?: string
    category?: string
    images?: Array<{ id: string, url: string, isMain: boolean }>
  }
  src?: string
  alt?: string
  className?: string
  width?: number
  height?: number
  priority?: boolean
  onClick?: () => void
  showViewer?: boolean
  forceRefresh?: boolean | number
}

export function ProductImage({
  product,
  src,
  alt,
  className,
  width,
  height,
  priority,
  onClick,
  showViewer = true,
  forceRefresh = false,
}: ProductImageProps) {
  const [isViewerOpen, setIsViewerOpen] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  
  // 如果提供了product，优先使用Cloudinary URL
  const cloudinaryUrl = product?.barcode ? getProductMainImageUrl(product.barcode) : null
  
  // 确定最终使用的图片URL
  let imageSrc = cloudinaryUrl || src || product?.images?.find(img => img.isMain)?.url
  
  // 如果需要强制刷新，添加时间戳参数
  if (forceRefresh) {
    const timestamp = typeof forceRefresh === 'number' ? forceRefresh : new Date().getTime()
    imageSrc = imageSrc ? `${imageSrc}?t=${timestamp}` : imageSrc
  }
  
  // 如果Cloudinary图片加载失败，尝试使用数据库中的图片
  const dbImageUrl = product?.images?.find(img => img.isMain)?.url
  
  // 当组件挂载或图片URL变化时，检查图片是否已经缓存
  useEffect(() => {
    if (!imageSrc) return;
    
    setImageLoaded(false);
    setImageError(false);
    
    // 创建一个新的Image对象来预加载图片
    const img = new window.Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      // 如果是Cloudinary URL加载失败且有数据库图片，尝试加载数据库图片
      if (imageSrc === cloudinaryUrl && dbImageUrl && retryCount === 0) {
        setRetryCount(1);
      } else {
        setImageLoaded(false);
        setImageError(true);
      }
    };
    
    // 添加一个随机参数，确保不使用缓存
    const finalSrc = retryCount > 0 && dbImageUrl 
      ? dbImageUrl 
      : (imageSrc.includes('?') ? imageSrc : `${imageSrc}?_=${Date.now()}`);
    
    img.src = finalSrc;
    
    // 如果图片已经存在于浏览器缓存中，onload可能不会触发
    // 所以我们需要检查图片是否已经完成加载
    if (img.complete) {
      setImageLoaded(true);
    }
    
    return () => {
      // 清理事件监听器
      img.onload = null;
      img.onerror = null;
    };
  }, [imageSrc, cloudinaryUrl, dbImageUrl, retryCount, forceRefresh]);
  
  // 处理图片点击
  const handleImageClick = () => {
    if (onClick) {
      onClick();
    } else if (showViewer && product) {
      setIsViewerOpen(true);
    }
  };

  // 强制刷新图片
  const refreshImage = () => {
    setImageLoaded(false);
    setImageError(false);
    setRetryCount(0);
    
    // 添加一个随机参数到URL，强制浏览器重新加载图片
    const timestamp = new Date().getTime();
    
    // 创建一个新的Image对象来预加载图片
    const img = new window.Image();
    
    img.onload = () => {
      setImageLoaded(true);
      setImageError(false);
    };
    
    img.onerror = () => {
      setImageLoaded(false);
      setImageError(true);
    };
    
    // 设置图片源并开始加载
    const url = cloudinaryUrl || src || product?.images?.find(img => img.isMain)?.url;
    if (url) {
      img.src = `${url}?t=${timestamp}&force=true`;
      
      // 更新DOM中的图片元素
      if (imageRef.current) {
        imageRef.current.src = img.src;
      }
    }
  };

  return (
    <>
      <div 
        className={cn("relative overflow-hidden rounded-md", className)}
        onClick={handleImageClick}
        style={{ cursor: (onClick || (showViewer && product)) ? 'pointer' : 'default' }}
      >
        {!imageError ? (
          <>
            <img
              ref={imageRef}
              src={retryCount > 0 && dbImageUrl ? dbImageUrl : imageSrc}
              alt={alt || product?.description || "商品图片"}
              className={cn("h-full w-full object-cover", imageLoaded ? "block" : "hidden")}
              width={width}
              height={height}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-xs text-gray-500">加载中...</span>
              </div>
            )}
          </>
        ) : (
          <PlaceholderImage className="h-full w-full" />
        )}
      </div>
      
      {product && showViewer && (
        <ProductImageViewer
          product={product}
          open={isViewerOpen}
          onOpenChange={setIsViewerOpen}
          forceRefresh={forceRefresh}
        />
      )}
    </>
  )
} 