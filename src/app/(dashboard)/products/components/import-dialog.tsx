"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (file: File) => Promise<void>
}

// 辅助函数：格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

// 辅助函数：检查文件是否符合要求
const validateFile = (file: File): { valid: boolean; error?: string } => {
  // 检查文件类型
  if (!file.name.match(/\.(xlsx|xls)$/i)) {
    return { valid: false, error: '只支持.xlsx或.xls格式的Excel文件' }
  }
  
  // 检查文件大小（10MB限制）
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `文件大小超过限制，最大允许10MB，当前文件大小${formatFileSize(file.size)}` 
    }
  }
  
  return { valid: true }
}

export function ImportDialog({ open, onOpenChange, onImport }: ImportDialogProps) {
  console.log('ImportDialog rendered:', { open, onOpenChange })
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setFileError(null)
    
    if (!file) {
      setSelectedFile(null)
      return
    }
    
    // 验证文件
    const validation = validateFile(file)
    if (!validation.valid) {
      setFileError(validation.error)
      setSelectedFile(null)
      e.target.value = '' // 重置文件输入
      return
    }
    
    setSelectedFile(file)
  }
  
  const handleImportClick = async () => {
    if (!selectedFile) {
      setFileError('请选择要导入的文件')
      return
    }
    
    try {
      setIsLoading(true)
      console.log('开始导入文件:', selectedFile.name)
      await onImport(selectedFile)
      console.log('导入成功')
      toast.success('导入成功')
      onOpenChange(false)
      // 重置状态
      setSelectedFile(null)
      setFileError(null)
    } catch (error) {
      console.error('导入错误:', error)
      // 错误处理已在handleImport函数中完成
    } finally {
      setIsLoading(false)
    }
  }
  
  // 关闭对话框时重置状态
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedFile(null)
      setFileError(null)
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              <li><strong>大量数据建议分批导入</strong>，每批不超过20个产品</li>
            </ul>
          </div>
          
          {fileError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{fileError}</AlertDescription>
            </Alert>
          )}
          
          {selectedFile && (
            <div className="text-sm">
              <p className="font-medium">已选择文件:</p>
              <p>{selectedFile.name} ({formatFileSize(selectedFile.size)})</p>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="mr-2 h-4 w-4" />
              下载模板
            </Button>
            
            <div className="flex gap-2">
              <div className="relative">
                <Button variant="outline" disabled={isLoading}>
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
              
              <Button 
                onClick={handleImportClick} 
                disabled={isLoading || !selectedFile}
              >
                {isLoading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    导入中...
                  </>
                ) : '开始导入'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 