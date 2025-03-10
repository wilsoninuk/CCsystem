import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// 图片相关的schema
const imageSchema = z.object({
  imageFormat: z.enum(["jpg", "png"]).default("jpg"),
  picture: z.string().nullable(),
  additionalPictures: z.array(z.string().nullable()).default([])
})

// 商品表单验证规则
const productSchema = z.object({
  itemNo: z.string().min(1, "商品编号不能为空"),
  barcode: z.string().min(1, "条形码不能为空"),
  description: z.string().min(1, "商品描述不能为空"),
  category: z.string().nullable(),
  cost: z.number().min(0.01, "成本必须大于0"),
  supplier: z.string().nullable(),
  color: z.string().nullable(),
  material: z.string().nullable(),
  productSize: z.string().nullable(),
  cartonSize: z.string().nullable(),
  cartonWeight: z.number().nullable(),
  moq: z.number().nullable(),
  link1688: z.string().url("请输入有效的URL").nullable(),
  ...imageSchema.shape
})

type ProductFormValues = z.infer<typeof productSchema>

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSuccess
}: CreateProductDialogProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      itemNo: "",
      barcode: "",
      description: "",
      category: null,
      cost: 0,
      supplier: null,
      color: null,
      material: null,
      productSize: null,
      cartonSize: null,
      cartonWeight: null,
      moq: null,
      link1688: null,
      imageFormat: "jpg",
      picture: null,
      additionalPictures: [null, null, null, null]
    }
  })

  const generateImageUrl = (barcode: string, index?: number) => {
    const format = form.getValues("imageFormat")
    const baseUrl = "https://res.cloudinary.com/duiecmcry/image/upload/v1/products/"
    
    if (typeof index === 'number') {
      return `${baseUrl}${barcode}_${index + 1}.${format}`
    }
    return `${baseUrl}${barcode}.${format}`
  }

  const handleGenerateUrl = (index?: number) => {
    const barcode = form.getValues("barcode")
    if (!barcode) {
      toast.error("请先输入条形码")
      return
    }

    const url = generateImageUrl(barcode, index)
    
    if (typeof index === 'number') {
      const currentAdditionalPictures = form.getValues("additionalPictures")
      currentAdditionalPictures[index] = url
      form.setValue("additionalPictures", currentAdditionalPictures)
    } else {
      form.setValue("picture", url)
    }
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          cost: parseFloat(values.cost.toString()),
          moq: values.moq ? parseInt(values.moq.toString()) : null,
          cartonWeight: values.cartonWeight ? parseFloat(values.cartonWeight.toString()) : null,
          additionalPictures: values.additionalPictures.filter(url => url !== null)
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建失败")
      }

      toast.success("创建成功")
      form.reset()
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-none px-6 py-4">
          <DialogTitle>创建商品</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="px-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
              {/* 基本信息部分 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="itemNo">商品编号 <span className="text-red-500">*</span></Label>
                    <Input {...form.register("itemNo")} />
                    {form.formState.errors.itemNo && (
                      <p className="text-xs text-red-500">{form.formState.errors.itemNo.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="barcode">条形码 <span className="text-red-500">*</span></Label>
                    <Input {...form.register("barcode")} />
                    {form.formState.errors.barcode && (
                      <p className="text-xs text-red-500">{form.formState.errors.barcode.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="description">商品描述 <span className="text-red-500">*</span></Label>
                  <Input {...form.register("description")} />
                  {form.formState.errors.description && (
                    <p className="text-xs text-red-500">{form.formState.errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* 图片部分 */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>图片格式</Label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="jpg"
                        {...form.register("imageFormat")}
                        defaultChecked
                      />
                      <span>JPG</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="png"
                        {...form.register("imageFormat")}
                      />
                      <span>PNG</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>主图</Label>
                  <div className="flex gap-2">
                    <Input
                      {...form.register("picture")}
                      placeholder={`示例: https://res.cloudinary.com/duiecmcry/image/upload/v1/products/6991234567890.${form.getValues("imageFormat")}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleGenerateUrl()}
                    >
                      生成URL
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>附图（最多4张）</Label>
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          {...form.register(`additionalPictures.${index}`)}
                          placeholder={`示例: https://res.cloudinary.com/duiecmcry/image/upload/v1/products/6991234567890_${index + 1}.${form.getValues("imageFormat")}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleGenerateUrl(index)}
                        >
                          生成URL
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 其他信息部分 */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="category">类别</Label>
                    <Input {...form.register("category")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cost">成本 <span className="text-red-500">*</span></Label>
                    <Input 
                      {...form.register("cost", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                    />
                    {form.formState.errors.cost && (
                      <p className="text-xs text-red-500">{form.formState.errors.cost.message}</p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="supplier">供应商</Label>
                    <Input {...form.register("supplier")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="color">颜色/款式</Label>
                    <Input {...form.register("color")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="material">材料</Label>
                    <Input {...form.register("material")} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="productSize">产品尺寸</Label>
                    <Input 
                      {...form.register("productSize")}
                      placeholder="例：10x20x30cm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cartonSize">装箱尺寸</Label>
                    <Input 
                      {...form.register("cartonSize")}
                      placeholder="例：30x40x50cm"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="cartonWeight">装箱重量(kg)</Label>
                    <Input 
                      {...form.register("cartonWeight", { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="moq">MOQ</Label>
                    <Input 
                      {...form.register("moq", { valueAsNumber: true })}
                      type="number"
                      min="0"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label htmlFor="link1688">1688链接</Label>
                    <Input 
                      {...form.register("link1688")}
                      type="url"
                      placeholder="https://detail.1688.com/..."
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="flex-none px-6 py-4 border-t">
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              type="button"
            >
              取消
            </Button>
            <Button onClick={form.handleSubmit(onSubmit)} disabled={isLoading}>
              {isLoading ? "创建中..." : "确定"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 