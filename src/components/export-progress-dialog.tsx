"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface ExportProgressDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  progress: number
  status: string
  fileName?: string
  isCompleted: boolean
}

export function ExportProgressDialog({
  open,
  onOpenChange,
  progress,
  status,
  fileName,
  isCompleted
}: ExportProgressDialogProps) {
  // 防止对话框在完成后立即关闭，给用户一些时间看到100%
  const [canClose, setCanClose] = useState(false)

  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setCanClose(true)
      }, 1000)
      return () => clearTimeout(timer)
    } else {
      setCanClose(false)
    }
  }, [isCompleted])

  // 如果完成并且可以关闭，自动关闭对话框
  useEffect(() => {
    if (isCompleted && canClose) {
      const timer = setTimeout(() => {
        onOpenChange(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isCompleted, canClose, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // 只有在可以关闭的情况下才允许用户关闭对话框
      if (!newOpen || canClose) {
        onOpenChange(newOpen)
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导出进度</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              {isCompleted ? "导出完成" : "正在导出..."}
            </span>
            <span className="text-sm text-muted-foreground">
              {progress}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex items-center text-sm text-muted-foreground">
            {!isCompleted && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <span>{status}</span>
          </div>
          {fileName && isCompleted && (
            <div className="text-sm text-muted-foreground mt-2">
              文件名: {fileName}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 