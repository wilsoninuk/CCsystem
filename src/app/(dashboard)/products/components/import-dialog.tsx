"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload } from "lucide-react"
import { toast } from "sonner"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  console.log('ImportDialog rendered:', { open, onOpenChange })
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/products/template')
      if (!response.ok) throw new Error('下载模板失败')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'products_template.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('下载模板失败')
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsLoading(true)
      await onImport(file)
      onOpenChange(false)
    } catch (error) {
      console.error('导入错误:', error)
    } finally {
      setIsLoading(false)
      e.target.value = '' // 重置文件输入
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
              <li>图片支持 http(s) 开头的图片链接</li>
              <li>成本和重量支持最多2位小数</li>
              <li>MOQ必须为整数</li>
              <li>Excel文件大小不能超过10MB</li>
            </ul>
          </div>
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