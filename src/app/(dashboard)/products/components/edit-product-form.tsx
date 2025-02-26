"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Product } from "@prisma/client"

// 使用与 ProductForm 相同的表单验证规则
const formSchema = z.object({
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
})

type FormValues = z.infer<typeof formSchema>

interface EditProductFormProps {
  product: Product
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function EditProductForm({ product, open, onOpenChange, onSuccess }: EditProductFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemNo: product.itemNo,
      barcode: product.barcode,
      description: product.description,
      category: product.category,
      cost: product.cost,
      supplier: product.supplier,
      color: product.color,
      material: product.material,
      productSize: product.productSize,
      cartonSize: product.cartonSize,
      cartonWeight: product.cartonWeight,
      moq: product.moq,
      link1688: product.link1688,
    }
  })

  const onSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data),
        credentials: 'include'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '更新失败')
      }

      toast.success('更新成功')
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新失败')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>编辑商品</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemNo">
              商品编号 <span className="text-red-500">*</span>
            </Label>
            <Input {...form.register("itemNo")} />
            {form.formState.errors.itemNo && (
              <p className="text-sm text-red-500">{form.formState.errors.itemNo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">
              条形码 <span className="text-red-500">*</span>
            </Label>
            <Input {...form.register("barcode")} />
            {form.formState.errors.barcode && (
              <p className="text-sm text-red-500">{form.formState.errors.barcode.message}</p>
            )}
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="description">
              商品描述 <span className="text-red-500">*</span>
            </Label>
            <Input {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-sm text-red-500">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">类别</Label>
            <Input {...form.register("category")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cost">
              成本 <span className="text-red-500">*</span>
            </Label>
            <Input 
              {...form.register("cost", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
            />
            {form.formState.errors.cost && (
              <p className="text-sm text-red-500">{form.formState.errors.cost.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">供应商</Label>
            <Input {...form.register("supplier")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">颜色/款式</Label>
            <Input {...form.register("color")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="material">材料</Label>
            <Input {...form.register("material")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productSize">产品尺寸</Label>
            <Input 
              {...form.register("productSize")}
              placeholder="例：10x20x30cm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cartonSize">装箱尺寸</Label>
            <Input 
              {...form.register("cartonSize")}
              placeholder="例：30x40x50cm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cartonWeight">装箱重量(kg)</Label>
            <Input 
              {...form.register("cartonWeight", { valueAsNumber: true })}
              type="number"
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moq">MOQ</Label>
            <Input 
              {...form.register("moq", { valueAsNumber: true })}
              type="number"
              min="0"
            />
          </div>

          <div className="col-span-2 space-y-2">
            <Label htmlFor="link1688">1688链接</Label>
            <Input 
              {...form.register("link1688")}
              type="url"
              placeholder="https://detail.1688.com/..."
            />
          </div>

          <div className="col-span-2 flex justify-end space-x-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              type="button"
            >
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "更新中..." : "确定"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 