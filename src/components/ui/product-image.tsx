"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductImageProps extends React.HTMLAttributes<HTMLDivElement> {
  src: string | null
  alt?: string
  className?: string
}

export function ProductImage({ src, alt = "", className, ...props }: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-md border bg-muted",
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-muted">
          <span className="text-muted-foreground">无图片</span>
        </div>
      )}
    </div>
  )
} 