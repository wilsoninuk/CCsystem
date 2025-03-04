import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Product, ProductImage, User } from "@prisma/client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ImageUpload } from "./image-upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

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

  const [images, setImages] = useState<ProductImage[]>(product.images || [])

  const handleImageUpload = async (imageUrl: string, isMain: boolean) => {
    try {
      const response = await fetch(`/api/products/${product.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: imageUrl, isMain })
      })

      if (!response.ok) {
        throw new Error('上传图片失败')
      }

      const newImage = await response.json()
      
      // 如果是主图，将其他图片设置为非主图
      if (isMain) {
        setImages(prev => prev.map(img => ({
          ...img,
          isMain: false
        })).concat([newImage]))
      } else {
        setImages(prev => [...prev, newImage])
      }

      toast.success('图片上传成功')
    } catch (error) {
      console.error('上传图片失败:', error)
      toast.error('上传图片失败')
    }
  }

  const handleImageDelete = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${product.id}/images/${imageId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '删除图片失败')
      }

      setImages(prev => prev.filter(img => img.id !== imageId))
      toast.success('图片删除成功')
    } catch (error) {
      console.error('删除图片失败:', error)
      toast.error(error instanceof Error ? error.message : '删除图片失败')
    }
  }

  const handleSetMainImage = async (imageId: string) => {
    try {
      const response = await fetch(`/api/products/${product.id}/images/${imageId}`, {
        method: 'PUT'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '设置主图失败')
      }

      setImages(prev => prev.map(img => ({
        ...img,
        isMain: img.id === imageId
      })))

      toast.success('设置主图成功')
    } catch (error) {
      console.error('设置主图失败:', error)
      toast.error(error instanceof Error ? error.message : '设置主图失败')
    }
  }

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
    } catch (error) {
      console.error('更新失败:', error)
      toast.error('更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>商品详情</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="images" className="w-full">
          <TabsList>
            <TabsTrigger value="images">图片管理</TabsTrigger>
            <TabsTrigger value="info">基本信息</TabsTrigger>
          </TabsList>

          <TabsContent value="images" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>主图</Label>
                <div className="mt-2 space-y-4">
                  {images.filter(img => img.isMain).map(image => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt="主图"
                        className="w-full h-auto rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleImageDelete(image.id)}
                      >
                        删除
                      </Button>
                    </div>
                  ))}
                  <ImageUpload
                    onUpload={(url) => handleImageUpload(url, true)}
                    text="上传主图"
                  />
                </div>
              </div>

              <div>
                <Label>附图</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  {images.filter(img => !img.isMain).map(image => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt="附图"
                        className="w-full h-auto rounded-lg"
                      />
                      <div className="absolute top-2 right-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSetMainImage(image.id)}
                        >
                          设为主图
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleImageDelete(image.id)}
                        >
                          删除
                        </Button>
                      </div>
                    </div>
                  ))}
                  <ImageUpload
                    onUpload={(url) => handleImageUpload(url, false)}
                    text="上传附图"
                  />
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
    </Dialog>
  )
} 