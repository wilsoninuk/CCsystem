"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
}

// 文件大小阈值（字节）
const LARGE_FILE_THRESHOLD = 100 * 1024; // 100KB - 用于测试，实际可能需要调整
const VERY_LARGE_FILE_THRESHOLD = 500 * 1024; // 500KB - 用于测试，实际可能需要调整

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  console.log('ImportDialog rendered:', { open, onOpenChange })
  
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null)
  
  // 当对话框关闭时重置状态
  useEffect(() => {
    if (!open) {
      setSelectedFile(null)
      setFileSizeWarning(null)
    }
  }, [open])

  const handleDownloadTemplate = () => {
    // 创建一个隐藏的a标签来触发下载
    const link = document.createElement('a')
    link.href = '/templates/products_template.xlsx'
    link.download = 'products_template.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setSelectedFile(file)
    
    // 检查文件大小并设置警告
    if (file.size > VERY_LARGE_FILE_THRESHOLD) {
      setFileSizeWarning(`文件较大 (${(file.size / 1024 / 1024).toFixed(2)}MB)，建议拆分为多个小文件（每个不超过50个产品）以避免超时。`)
    } else if (file.size > LARGE_FILE_THRESHOLD) {
      setFileSizeWarning(`文件大小适中 (${(file.size / 1024).toFixed(2)}KB)，如果包含大量产品，可能需要较长处理时间。`)
    } else {
      setFileSizeWarning(null)
    }
    
    handleImport(file)
  }

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true)
      await onImport(file)
      onOpenChange(false)
    } catch (error) {
      console.error('导入失败:', error)
      // 错误已经在onImport中处理，这里不需要额外处理
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>导入商品</DialogTitle>
          <DialogDescription>
            请先下载模板，按照模板格式填写商品信息后导入。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium">注意事项：</h4>
            <ul className="list-disc pl-4 text-sm text-muted-foreground">
              <li>商品编号、条形码、商品描述、成本为必填项</li>
              <li>条形码必须是13位数字，且不能重复</li>
              <li>系统会根据条形码自动从Cloudinary获取图片</li>
              <li>图片命名规则：主图为"条形码.jpg"，附图为"条形码_1.jpg"等</li>
              <li>成本和重量支持最多2位小数</li>
              <li>MOQ必须为整数</li>
              <li>Excel文件大小不能超过10MB</li>
              <li><strong>大批量导入（超过50个产品）建议拆分为多个小文件</strong></li>
            </ul>
          </div>
          
          {fileSizeWarning && (
            <Alert variant="warning" className="bg-amber-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>文件大小提醒</AlertTitle>
              <AlertDescription>
                {fileSizeWarning}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
            <div className="relative">
              <Button disabled={isLoading}>
                <Upload className="mr-2 h-4 w-4" />
                选择文件
              </Button>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 