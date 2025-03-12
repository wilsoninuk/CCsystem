import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface PlaceholderImageProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
}

/**
 * 占位图片组件
 * 用于在图片加载失败或不存在时显示
 */
export function PlaceholderImage({ 
  label = "无图片", 
  className, 
  ...props 
}: PlaceholderImageProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center bg-muted rounded-md",
        className
      )}
      {...props}
    >
      <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
      {label && (
        <span className="mt-2 text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
} 