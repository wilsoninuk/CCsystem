"use client"

import { Product } from "@prisma/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

interface ProductFormProps {
  product: Product
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const data = {
      itemNo: formData.get("itemNo") as string,
      description: formData.get("description") as string,
      cost: parseFloat(formData.get("cost") as string),
      barcode: formData.get("barcode") as string,
      color: formData.get("color") as string,
      material: formData.get("material") as string,
      productSize: formData.get("productSize") as string,
      cartonSize: formData.get("cartonSize") as string,
      cartonWeight: formData.get("cartonWeight") ? parseFloat(formData.get("cartonWeight") as string) : null,
      moq: formData.get("moq") ? parseInt(formData.get("moq") as string) : null,
      supplier: formData.get("supplier") as string,
      link1688: formData.get("link1688") as string,
    }

    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("更新失败")
      }

      toast.success("更新成功")
      router.push("/products")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新失败")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="itemNo">商品编号</Label>
            <Input
              id="itemNo"
              name="itemNo"
              defaultValue={product.itemNo}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost">成本</Label>
            <Input
              id="cost"
              name="cost"
              type="number"
              step="0.01"
              defaultValue={product.cost}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">商品描述</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={product.description}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="barcode">条形码</Label>
            <Input
              id="barcode"
              name="barcode"
              defaultValue={product.barcode || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">颜色/款式</Label>
            <Input
              id="color"
              name="color"
              defaultValue={product.color || ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="material">材料</Label>
            <Input
              id="material"
              name="material"
              defaultValue={product.material || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="productSize">产品尺寸</Label>
            <Input
              id="productSize"
              name="productSize"
              defaultValue={product.productSize || ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cartonSize">装箱尺寸</Label>
            <Input
              id="cartonSize"
              name="cartonSize"
              defaultValue={product.cartonSize || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cartonWeight">装箱重量 (kg)</Label>
            <Input
              id="cartonWeight"
              name="cartonWeight"
              type="number"
              step="0.01"
              defaultValue={product.cartonWeight || ""}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="moq">MOQ</Label>
            <Input
              id="moq"
              name="moq"
              type="number"
              defaultValue={product.moq || ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="supplier">供应商</Label>
            <Input
              id="supplier"
              name="supplier"
              defaultValue={product.supplier || ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="link1688">1688链接</Label>
          <Input
            id="link1688"
            name="link1688"
            defaultValue={product.link1688 || ""}
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "保存中..." : "保存"}
        </Button>
      </div>
    </form>
  )
} 