import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Product } from "@prisma/client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface ImportPreviewDialogProps {
  data: {
    success: Partial<Product>[]
    duplicates: {
      product: Partial<Product>
      existingProduct: Product
      reason: 'itemNo' | 'barcode'
    }[]
    errors: { row: number; error: string }[]
  } | null
  onConfirm: (includeDuplicates: boolean) => void
  onCancel: () => void
  isOpen: boolean
}

export function ImportPreviewDialog({
  data,
  onConfirm,
  onCancel,
  isOpen
}: ImportPreviewDialogProps) {
  if (!data) return null

  const { success, duplicates, errors } = data
  const hasDuplicates = duplicates.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>导入预览</DialogTitle>
          <DialogDescription>
            请确认导入的数据是否正确
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex justify-between text-sm">
            <span>总计: {success.length + duplicates.length + errors.length} 条数据</span>
            <span className="text-green-600">新增: {success.length} 条</span>
            {hasDuplicates && (
              <span className="text-yellow-600">重复: {duplicates.length} 条</span>
            )}
            <span className="text-red-600">错误: {errors.length} 条</span>
          </div>

          {hasDuplicates && (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>发现重复商品</AlertTitle>
              <AlertDescription>
                有 {duplicates.length} 条数据与现有商品重复（商品编号或条形码相同）。
                您可以选择：
                <div className="mt-2 space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => onConfirm(false)}
                  >
                    仅导入新商品 ({success.length} 条)
                  </Button>
                  <Button 
                    variant="default"
                    onClick={() => onConfirm(true)}
                  >
                    更新重复商品并导入 ({success.length + duplicates.length} 条)
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {hasDuplicates && (
            <div className="space-y-2">
              <h3 className="font-medium text-yellow-600">重复商品详情：</h3>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {duplicates.map(({ product, existingProduct, reason }, index) => (
                  <div key={index} className="mb-4 text-sm">
                    <div className="font-medium">
                      {reason === 'itemNo' ? '商品编号重复' : '条形码重复'}:
                    </div>
                    <div className="ml-4">
                      <div>导入数据: {product.itemNo} - {product.description}</div>
                      <div>现有商品: {existingProduct.itemNo} - {existingProduct.description}</div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-red-600">错误详情：</h3>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {errors.map(({ row, error }, index) => (
                  <div key={index} className="text-sm text-red-600">
                    第 {row} 行: {error}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {success.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-green-600">成功数据预览：</h3>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left">商品编号</th>
                      <th className="p-2 text-left">商品描述</th>
                      <th className="p-2 text-left">成本</th>
                      <th className="p-2 text-left">图片</th>
                    </tr>
                  </thead>
                  <tbody>
                    {success.map((product, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{product.itemNo}</td>
                        <td className="p-2">{product.description}</td>
                        <td className="p-2">{product.cost}</td>
                        <td className="p-2">{product.picture ? '有' : '无'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          {!hasDuplicates && (
            <Button 
              onClick={() => onConfirm(false)}
              disabled={success.length === 0}
            >
              确认导入 ({success.length} 条)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 