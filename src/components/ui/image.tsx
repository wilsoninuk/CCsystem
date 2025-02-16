"use client"

import Image from 'next/image'

interface ProductImageProps {
  src: string
  alt: string
  className?: string
}

export function ProductImage({ src, alt, className }: ProductImageProps) {
  if (!src) {
    return (
      <div className="relative aspect-square flex items-center justify-center bg-gray-50 rounded-md">
        <span className="text-sm text-gray-400">无图片</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-square">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className={`object-cover rounded-md ${className || ''}`}
      />
    </div>
  )
} 