import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Product, ProductImage, User } from "@prisma/client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import { getProductMainImageUrl, getProductAdditionalImageUrls } from "@/lib/cloudinary"
import Image from "next/image"
import { PlaceholderImage } from "@/components/ui/placeholder-image"
import { Upload, Trash2, RefreshCw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ProductDetailDialogProps {
  product: Product & {
    images: ProductImage[]
    creator: User | null
    updater: User | null
  }
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ProductDetailDialog({
  product,
  open,
  onOpenChange,
  onSuccess
}: ProductDetailDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    itemNo: product.itemNo,
    description: product.description,
    barcode: product.barcode,
    cost: product.cost,
    category: product.category || "",
    supplier: product.supplier || "",
    color: product.color || "",
    material: product.material || "",
    productSize: product.productSize || "",
    cartonSize: product.cartonSize || "",
    cartonWeight: product.cartonWeight || "",
    moq: product.moq || "",
    link1688: product.link1688 || ""
  })
  
  // 获取基于条形码的Cloudinary图片URL
  const cloudinaryMainImageUrl = getProductMainImageUrl(product.barcode)
  const cloudinaryAdditionalImageUrls = getProductAdditionalImageUrls(product.barcode, 4)
  
  // 图片加载状态
  const [mainImageLoaded, setMainImageLoaded] = useState(false)
  const [mainImageError, setMainImageError] = useState(false)
  const [additionalImagesLoaded, setAdditionalImagesLoaded] = useState<boolean[]>([false, false, false, false])
  const [additionalImagesError, setAdditionalImagesError] = useState<boolean[]>([false, false, false, false])
  
  // 图片操作状态
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({})
  const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({})
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<{ [key: string]: boolean }>({})
  const [selectedImageType, setSelectedImageType] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null)

  // 当对话框打开时重置加载状态
  useEffect(() => {
    if (open) {
      setMainImageLoaded(false)
      setMainImageError(false)
      setAdditionalImagesLoaded([false, false, false, false])
      setAdditionalImagesError([false, false, false, false])
    }
  }, [open])

  const handleSubmit = async () => {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('更新商品失败')
      }

      toast.success('更新成功')
      onSuccess?.()
      onOpenChange(false)
      
      // 使用router.refresh()刷新数据，而不是刷新整个页面
      router.refresh()
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  // 处理图片加载成功
  const handleMainImageLoad = () => {
    setMainImageLoaded(true)
    setMainImageError(false)
  }

  // 处理图片加载失败
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

  // 处理图片上传
  const handleImageUpload = async (type: string, index: number = -1) => {
    const imageKey = type === 'main' ? 'main' : `additional-${index}`
    setIsUploading({ ...isUploading, [imageKey]: true })
    
    try {
      // 创建一个文件选择器
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      // 监听文件选择事件
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) {
          setIsUploading({ ...isUploading, [imageKey]: false })
          return
        }
        
        // 创建FormData对象
        const formData = new FormData()
        formData.append('file', file)
        formData.append('productId', product.id)
        formData.append('barcode', product.barcode)
        
        if (type === 'main') {
          formData.append('isMain', 'true')
        } else {
          formData.append('isMain', 'false')
          formData.append('index', index.toString())
        }
        
        // 发送请求到服务器
        const response = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || '上传图片失败')
        }
        
        // 上传成功
        toast.success('图片上传成功')
        
        // 重置图片加载状态，强制重新加载图片
        if (type === 'main') {
          setMainImageLoaded(false)
          setMainImageError(false)
        } else {
          const newAdditionalImagesLoaded = [...additionalImagesLoaded]
          const newAdditionalImagesError = [...additionalImagesError]
          newAdditionalImagesLoaded[index] = false
          newAdditionalImagesError[index] = false
          setAdditionalImagesLoaded(newAdditionalImagesLoaded)
          setAdditionalImagesError(newAdditionalImagesError)
        }
        
        // 刷新页面数据
        router.refresh()
      }
      
      // 触发文件选择器
      input.click()
    } catch (error) {
      console.error('上传图片失败:', error)
      toast.error(error instanceof Error ? error.message : '上传图片失败')
    } finally {
      setIsUploading({ ...isUploading, [imageKey]: false })
    }
  }
  
  // 处理图片删除
  const handleImageDelete = async (type: string, index: number = -1) => {
    setSelectedImageType(type)
    setSelectedImageIndex(index)
    
    const imageKey = type === 'main' ? 'main' : `additional-${index}`
    setDeleteConfirmOpen({ ...deleteConfirmOpen, [imageKey]: true })
  }
  
  // 确认删除图片
  const confirmImageDelete = async () => {
    if (!selectedImageType) return
    
    const type = selectedImageType
    const index = selectedImageIndex !== null ? selectedImageIndex : -1
    const imageKey = type === 'main' ? 'main' : `additional-${index}`
    
    setIsDeleting({ ...isDeleting, [imageKey]: true })
    setDeleteConfirmOpen({ ...deleteConfirmOpen, [imageKey]: false })
    
    try {
      // 发送请求到服务器
      const response = await fetch('/api/upload/cloudinary', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          barcode: product.barcode,
          isMain: type === 'main',
          index: index
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除图片失败')
      }
      
      // 删除成功
      toast.success('图片删除成功')
      
      // 重置图片加载状态，强制重新加载图片
      if (type === 'main') {
        setMainImageLoaded(false)
        setMainImageError(true) // 设置为错误状态，显示占位图
      } else {
        const newAdditionalImagesLoaded = [...additionalImagesLoaded]
        const newAdditionalImagesError = [...additionalImagesError]
        newAdditionalImagesLoaded[index] = false
        newAdditionalImagesError[index] = true // 设置为错误状态，显示占位图
        setAdditionalImagesLoaded(newAdditionalImagesLoaded)
        setAdditionalImagesError(newAdditionalImagesError)
      }
      
      // 刷新页面数据
      router.refresh()
    } catch (error) {
      console.error('删除图片失败:', error)
      toast.error(error instanceof Error ? error.message : '删除图片失败')
    } finally {
      setIsDeleting({ ...isDeleting, [imageKey]: false })
      setSelectedImageType(null)
      setSelectedImageIndex(null)
    }
  }
  
  // 处理图片刷新
  const handleImageRefresh = (type: string, index: number = -1) => {
    const imageKey = type === 'main' ? 'main' : `additional-${index}`
    
    // 重置图片加载状态，强制重新加载图片
    if (type === 'main') {
      setMainImageLoaded(false)
      setMainImageError(false)
    } else {
      const newAdditionalImagesLoaded = [...additionalImagesLoaded]
      const newAdditionalImagesError = [...additionalImagesError]
      newAdditionalImagesLoaded[index] = false
      newAdditionalImagesError[index] = false
      setAdditionalImagesLoaded(newAdditionalImagesLoaded)
      setAdditionalImagesError(newAdditionalImagesError)
    }
    
    // 添加一个随机参数到URL，强制浏览器重新加载图片
    const timestamp = new Date().getTime()
    
    // 使用window.Image对象预加载图片并监听加载完成事件
    const img = new window.Image()
    
    img.onload = () => {
      // 图片加载成功后更新状态
      if (type === 'main') {
        setMainImageLoaded(true)
        setMainImageError(false)
      } else {
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
      } else {
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
    if (type === 'main') {
      img.src = `${cloudinaryMainImageUrl}?t=${timestamp}&force=true`
    } else {
      img.src = `${cloudinaryAdditionalImageUrls[index]}?t=${timestamp}&force=true`
    }
    
    toast.success('正在刷新图片...')
    
    // 更新DOM中的图片元素
    setTimeout(() => {
      const imgElements = document.querySelectorAll(`img[src^="${type === 'main' ? cloudinaryMainImageUrl : cloudinaryAdditionalImageUrls[index]}"]`)
      imgElements.forEach(imgEl => {
        if (imgEl instanceof HTMLImageElement) {
          imgEl.src = img.src
        }
      })
    }, 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>商品详情</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="cloudinary" className="w-full">
          <TabsList>
            <TabsTrigger value="cloudinary">Cloudinary图片</TabsTrigger>
            <TabsTrigger value="info">基本信息</TabsTrigger>
          </TabsList>

          {/* Cloudinary图片标签页 */}
          <TabsContent value="cloudinary" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>主图</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleImageUpload('main')}
                      disabled={isUploading['main']}
                    >
                      {isUploading['main'] ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          上传中...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          上传
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleImageDelete('main')}
                      disabled={isDeleting['main'] || mainImageError}
                    >
                      {isDeleting['main'] ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          删除中...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleImageRefresh('main')}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    {!mainImageError ? (
                      <>
                        <img
                          src={cloudinaryMainImageUrl}
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
                    ) : (
                      <div className="relative">
                        <PlaceholderImage className="w-full h-full" />
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                          onClick={() => handleImageUpload('main')}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          上传图片
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium mb-1">主图URL:</p>
                    <div className="overflow-x-auto">
                      <code className="text-xs break-all">{cloudinaryMainImageUrl}</code>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>附图</Label>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {cloudinaryAdditionalImageUrls.map((url, index) => (
                    <div key={`cloudinary-${index}`} className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium">附图 {index + 1}</span>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleImageUpload('additional', index)}
                            disabled={isUploading[`additional-${index}`]}
                          >
                            {isUploading[`additional-${index}`] ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Upload className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleImageDelete('additional', index)}
                            disabled={isDeleting[`additional-${index}`] || additionalImagesError[index]}
                          >
                            {isDeleting[`additional-${index}`] ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => handleImageRefresh('additional', index)}
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="relative aspect-square overflow-hidden rounded-lg">
                        {!additionalImagesError[index] ? (
                          <>
                            <img
                              src={url}
                              alt={`附图 ${index + 1}`}
                              className={`w-full h-full object-cover ${additionalImagesLoaded[index] ? 'block' : 'hidden'}`}
                              onLoad={() => handleAdditionalImageLoad(index)}
                              onError={() => handleAdditionalImageError(index)}
                            />
                            {!additionalImagesLoaded[index] && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                                <span className="text-xs text-gray-500">加载中...</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="relative">
                            <PlaceholderImage className="w-full h-full" label={`附图 ${index + 1}`} />
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75"
                              onClick={() => handleImageUpload('additional', index)}
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              上传
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-2 bg-gray-50 rounded-md">
                  <p className="text-xs font-medium mb-1">附图URL格式:</p>
                  <div className="overflow-x-auto">
                    <code className="text-xs break-all">products/{product.barcode}_1.jpg</code> 到 <code className="text-xs break-all">products/{product.barcode}_4.jpg</code>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemNo">商品编号</Label>
                <Input
                  id="itemNo"
                  value={formData.itemNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, itemNo: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="barcode">条形码</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">商品描述</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cost">成本</Label>
                <Input
                  id="cost"
                  type="number"
                  value={formData.cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost: parseFloat(e.target.value) }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">类别</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">供应商</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">颜色/款式</Label>
                <Input
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="material">材料</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productSize">产品尺寸</Label>
                <Input
                  id="productSize"
                  value={formData.productSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, productSize: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartonSize">装箱尺寸</Label>
                <Input
                  id="cartonSize"
                  value={formData.cartonSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, cartonSize: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartonWeight">装箱重量</Label>
                <Input
                  id="cartonWeight"
                  type="number"
                  value={formData.cartonWeight}
                  onChange={(e) => setFormData(prev => ({ ...prev, cartonWeight: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="moq">MOQ</Label>
                <Input
                  id="moq"
                  type="number"
                  value={formData.moq}
                  onChange={(e) => setFormData(prev => ({ ...prev, moq: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link1688">1688链接</Label>
                <Input
                  id="link1688"
                  value={formData.link1688}
                  onChange={(e) => setFormData(prev => ({ ...prev, link1688: e.target.value }))}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? '保存中...' : '保存'}
          </Button>
        </div>
      </DialogContent>
      
      {/* 删除确认对话框 */}
      <AlertDialog 
        open={Object.values(deleteConfirmOpen).some(value => value)} 
        onOpenChange={(open: boolean) => {
          if (!open) {
            setDeleteConfirmOpen({})
            setSelectedImageType(null)
            setSelectedImageIndex(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除图片</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这张图片吗？此操作无法撤销，图片将从Cloudinary中永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmImageDelete}>确认删除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
} 