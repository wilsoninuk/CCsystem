"use client"

import Image from "next/image"

interface ProductImageProps {
  src: string | null
  alt: string
}

export function ProductImage({ src, alt }: ProductImageProps) {
  if (!src) {
    return (
      <div className="w-full h-full flex items-center justify-center border rounded-md bg-gray-50">
        <span className="text-sm text-gray-400">无图片</span>
      </div>
    )
  }

  return (
    <div className="relative aspect-square w-full h-full">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
      />
    </div>
  )
} 