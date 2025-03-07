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

// 定义表单验证schema
const productSchema = z.object({
  // 基本信息 - 必填
  itemNo: z.string().min(1, "商品编号不能为空"),
  barcode: z.string().min(1, "条形码不能为空"),
  description: z.string().min(1, "商品描述不能为空"),
  cost: z.string().min(1, "成本不能为空").regex(/^\d+(\.\d{1,2})?$/, "请输入有效的金额"),
  
  // 基本信息 - 选填
  category: z.string().optional(),
  supplier: z.string().optional(),
  
  // 商品特征 - 选填
  color: z.string().optional(),
  material: z.string().optional(),
  productSize: z.string().optional(),
  moq: z.string().regex(/^\d*$/, "请输入有效的数字").optional(),
  
  // 包装信息 - 选填
  cartonSize: z.string().optional(),
  cartonWeight: z.string().regex(/^\d+(\.\d{1,2})?$/, "请输入有效的重量").optional(),
  
  // 其他信息 - 选填
  link1688: z.string().url("请输入有效的URL").optional().or(z.literal("")),
  picture: z.string().optional(),
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
      cost: "",
      category: "",
      supplier: "",
      color: "",
      material: "",
      productSize: "",
      moq: "",
      cartonSize: "",
      cartonWeight: "",
      link1688: "",
      picture: "",
    },
  })

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsLoading(true)
      
      // 转换数值类型
      const formattedData = {
        ...data,
        cost: parseFloat(data.cost),
        moq: data.moq ? parseInt(data.moq) : undefined,
        cartonWeight: data.cartonWeight ? parseFloat(data.cartonWeight) : undefined,
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "创建失败")
      }

      toast.success("创建成功")
      form.reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1">
          <DialogTitle>新增商品</DialogTitle>
          <DialogDescription>
            请填写商品信息，带 * 的字段为必填项
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* 基本信息 */}
              <div className="col-span-2 space-y-2">
                <h3 className="font-semibold text-sm">基本信息</h3>
                <div className="grid grid-cols-2 gap-3">
                  {/* 商品编号 */}
                  <FormField
                    control={form.control}
                    name="itemNo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">商品编号 *</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 条形码 */}
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">条形码 *</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 商品描述 */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">商品描述 *</FormLabel>
                        <FormControl>
                          <Textarea {...field} className="min-h-[40px] h-[40px] resize-none" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 成本和类别 */}
                  <FormField
                    control={form.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">成本 *</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">类别</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 供应商 */}
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs">供应商</FormLabel>
                        <FormControl>
                          <Input {...field} className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 商品特征和包装信息 */}
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">商品特征</h3>
                  <div className="space-y-3">
                    {/* 颜色 */}
                    <FormField
                      control={form.control}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">颜色</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 材质 */}
                    <FormField
                      control={form.control}
                      name="material"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">材质</FormLabel>
                          <FormControl>
                            <Input {...field} className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 商品尺寸 */}
                    <FormField
                      control={form.control}
                      name="productSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">商品尺寸</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="例如: 10x20x30cm" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 最小订购量 */}
                    <FormField
                      control={form.control}
                      name="moq"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">最小订购量</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">包装信息</h3>
                  <div className="space-y-3">
                    {/* 箱规 */}
                    <FormField
                      control={form.control}
                      name="cartonSize"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">箱规</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="例如: 60x40x20cm" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 箱重 */}
                    <FormField
                      control={form.control}
                      name="cartonWeight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">箱重(kg)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" step="0.01" className="h-8" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* 其他信息 */}
              <div className="col-span-2 space-y-2">
                <h3 className="font-semibold text-sm">其他信息</h3>
                <div className="space-y-3">
                  {/* 1688链接 */}
                  <FormField
                    control={form.control}
                    name="link1688"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">1688链接</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" className="h-8" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 商品图片 */}
                  <FormField
                    control={form.control}
                    name="picture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">商品图片</FormLabel>
                        <FormControl>
                          <Input {...field} type="url" placeholder="请输入图片URL" className="h-8" />
                        </FormControl>
                        <FormDescription className="text-xs">
                          目前支持图片URL,后续将支持文件上传
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-8">
                取消
              </Button>
              <Button type="submit" disabled={isLoading} className="h-8">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 